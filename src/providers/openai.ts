import { ProviderResponse, ProviderRunConfig, ReasoningEffort } from "../types/index.js";
import {
  isObject,
  OpenAIResponse,
  OpenAIOutputItem,
  OpenAITextContent,
  OpenAIChoice,
} from "../types/api-responses.js";
import { ProviderSpec, runWithFallback } from "./base.js";

function supportsTemperature(model: string, reasoningEffort?: ReasoningEffort): boolean {
  // GPT-5 Pro models don't support temperature (effort cannot be set to "none")
  if (/^gpt-5(\.\d+)?-pro$/.test(model)) return false;
  // GPT-5 base/Mini/Nano don't support temperature
  if (model === "gpt-5" || model === "gpt-5-mini" || model === "gpt-5-nano") return false;
  // GPT-5.2/5.1 only support temperature when reasoning.effort="none"
  if (/^gpt-5\.\d+$/.test(model)) {
    return reasoningEffort === "none";
  }
  return true;
}

function isReasoningModel(model: string): boolean {
  // GPT-5 Mini/Nano are reasoning models that consume tokens for reasoning
  return model === "gpt-5-mini" || model === "gpt-5-nano";
}

export function extractText(payload: unknown): string {
  if (!isObject(payload)) return "";

  const p = payload as OpenAIResponse;

  if (typeof p.output_text === "string") {
    return p.output_text;
  }

  if (Array.isArray(p.output)) {
    const parts: string[] = [];
    for (const item of p.output) {
      if (!isObject(item)) continue;
      const it = item as OpenAIOutputItem;
      if (it.type === "message" && Array.isArray(it.content)) {
        for (const c of it.content) {
          if (!isObject(c)) continue;
          const content = c as OpenAITextContent;
          if (typeof content.text === "string") parts.push(content.text);
          if (typeof content.output_text === "string") parts.push(content.output_text);
        }
      }
    }
    if (parts.length) return parts.join("\n");
  }

  if (Array.isArray(p.choices)) {
    const choice = p.choices[0] as OpenAIChoice | undefined;
    if (typeof choice?.message?.content === "string") {
      return choice.message.content;
    }
  }

  return "";
}

const openaiSpec: ProviderSpec = {
  providerId: "openai",
  apiKeyEnvVar: "OPENAI_API_KEY",
  getEndpoint: () => "https://api.openai.com/v1/responses",
  getHeaders: (apiKey) => ({ authorization: `Bearer ${apiKey}` }),
  buildBody: (model, prompt, cfg) => {
    // Reasoning models need more tokens since reasoning consumes output tokens
    const baseTokens = cfg.max_output_tokens ?? 800;
    const maxTokens = isReasoningModel(model)
      ? Math.max(baseTokens * 4, 4000)
      : baseTokens;
    const body: Record<string, unknown> = {
      model,
      input: prompt,
      max_output_tokens: maxTokens,
      instructions: cfg.system,
      store: false,
    };
    // GPT-5.2/5.1 support configurable reasoning.effort
    if (/^gpt-5\.\d+$/.test(model) && cfg.reasoning_effort) {
      body.reasoning = { effort: cfg.reasoning_effort };
    }
    if (typeof cfg.temperature === "number" && supportsTemperature(model, cfg.reasoning_effort)) {
      body.temperature = cfg.temperature;
    }
    return body;
  },
  extractText,
};

export async function runOpenAI(
  prompt: string,
  cfg: ProviderRunConfig
): Promise<ProviderResponse> {
  return runWithFallback(prompt, cfg, openaiSpec);
}

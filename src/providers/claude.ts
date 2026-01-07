import { ProviderResponse, ProviderRunConfig } from "../types/index.js";
import { isObject, ClaudeResponse, ClaudeContentBlock } from "../types/api-responses.js";
import { ProviderSpec, runWithFallback } from "./base.js";

export function extractText(payload: unknown): string {
  if (!isObject(payload)) return "";

  const p = payload as ClaudeResponse;

  if (Array.isArray(p.content)) {
    const parts: string[] = [];
    for (const b of p.content) {
      if (!isObject(b)) continue;
      const block = b as ClaudeContentBlock;
      if (typeof block.text === "string") parts.push(block.text);
      if (typeof block.content === "string") parts.push(block.content);
    }
    if (parts.length) return parts.join("\n");
  }

  if (typeof p.completion === "string") return p.completion;

  return "";
}

const claudeSpec: ProviderSpec = {
  providerId: "claude",
  apiKeyEnvVar: "ANTHROPIC_API_KEY",
  getEndpoint: () => "https://api.anthropic.com/v1/messages",
  getHeaders: (apiKey) => ({
    "x-api-key": apiKey,
    "anthropic-version": "2023-06-01",
  }),
  buildBody: (model, prompt, cfg) => {
    const body: Record<string, unknown> = {
      model,
      max_tokens: cfg.max_output_tokens ?? 800,
      messages: [{ role: "user", content: prompt }],
    };
    if (typeof cfg.temperature === "number") {
      body.temperature = cfg.temperature;
    }
    if (cfg.system?.trim()) {
      body.system = cfg.system;
    }
    return body;
  },
  extractText,
};

export async function runClaude(
  prompt: string,
  cfg: ProviderRunConfig
): Promise<ProviderResponse> {
  return runWithFallback(prompt, cfg, claudeSpec);
}

import { ProviderResponse, ProviderRunConfig } from "../types/index.js";
import { DEFAULT_MAX_OUTPUT_TOKENS } from "../constants.js";
import {
  isObject,
  GeminiResponse,
  GeminiCandidate,
  GeminiPart,
} from "../types/api-responses.js";
import { ProviderSpec, runWithFallback } from "./base.js";

export function extractText(payload: unknown): string {
  if (!isObject(payload)) return "";

  const p = payload as GeminiResponse;

  // Check for prompt-level blocking
  if (p.promptFeedback?.blockReason) {
    return `[Blocked: ${p.promptFeedback.blockReason}]`;
  }

  if (Array.isArray(p.candidates) && p.candidates.length > 0) {
    const c0 = p.candidates[0] as GeminiCandidate | undefined;

    // Check for candidate-level finish reason
    const finishReason = c0?.finishReason;
    const content = c0?.content;

    if (content?.parts && Array.isArray(content.parts)) {
      const parts: string[] = [];
      for (const part of content.parts) {
        if (!isObject(part)) continue;
        const pt = part as GeminiPart;
        if (typeof pt.text === "string") parts.push(pt.text);
      }
      if (parts.length) return parts.join("\n");
    }

    // No text but have finish reason
    if (finishReason && finishReason !== "STOP") {
      return `[No content: ${finishReason}]`;
    }
  } else if (Array.isArray(p.candidates) && p.candidates.length === 0) {
    return "[No candidates returned]";
  }

  if (typeof p.text === "string") return p.text;

  return "";
}

const geminiSpec: ProviderSpec = {
  providerId: "gemini",
  apiKeyEnvVar: "GEMINI_API_KEY",
  getEndpoint: (model, apiKey) =>
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
  getHeaders: () => ({}),
  buildBody: (model, prompt, cfg) => {
    const generationConfig: Record<string, unknown> = {
      maxOutputTokens: cfg.max_output_tokens ?? DEFAULT_MAX_OUTPUT_TOKENS,
    };
    if (typeof cfg.temperature === "number") {
      generationConfig.temperature = cfg.temperature;
    }

    const body: Record<string, unknown> = {
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      generationConfig,
    };

    if (cfg.system?.trim()) {
      body.systemInstruction = {
        role: "system",
        parts: [{ text: cfg.system }],
      };
    }

    return body;
  },
  extractText,
};

export async function runGemini(
  prompt: string,
  cfg: ProviderRunConfig
): Promise<ProviderResponse> {
  return runWithFallback(prompt, cfg, geminiSpec);
}

import {
  ProviderId,
  ProviderFailure,
  ProviderResponse,
  ProviderRunConfig,
  TokenUsage,
  createApiKeyMissingError,
  createTimeoutError,
} from "../types/index.js";
import {
  isObject,
  OpenAIUsage,
  ClaudeUsage,
  GeminiUsageMetadata,
  ErrorResponse,
} from "../types/api-responses.js";
import { HttpResult, postJson } from "./http.js";
import { MODEL_ERROR_PATTERNS, MODEL_FALLBACK_STATUS_CODES, DEFAULT_TIMEOUT_MS } from "../constants.js";

export function extractTokens(provider: ProviderId, raw: unknown): TokenUsage | undefined {
  if (!isObject(raw)) return undefined;

  if (provider === "openai") {
    const usage = raw.usage as OpenAIUsage | undefined;
    if (!usage) return undefined;
    return { input_tokens: usage.prompt_tokens, output_tokens: usage.completion_tokens };
  }

  if (provider === "claude") {
    const usage = raw.usage as ClaudeUsage | undefined;
    if (!usage) return undefined;
    return { input_tokens: usage.input_tokens, output_tokens: usage.output_tokens };
  }

  if (provider === "gemini") {
    const meta = raw.usageMetadata as GeminiUsageMetadata | undefined;
    if (!meta) return undefined;
    return { input_tokens: meta.promptTokenCount, output_tokens: meta.candidatesTokenCount };
  }

  return undefined;
}

export function asModelList(model: string | string[]): string[] {
  return Array.isArray(model) ? model : [model];
}

export function extractErrorMessage(res: HttpResult<unknown>): string {
  const data = res.data as ErrorResponse | undefined;
  if (data) {
    if (data.error?.message) return String(data.error.message);
    if (data.message) return String(data.message);
  }
  return res.text ?? `HTTP ${res.status}`;
}

export function shouldTryNextModel(
  message: string,
  status: number,
  modelsRemaining: number
): boolean {
  if (modelsRemaining <= 0) return false;
  if (
    !MODEL_FALLBACK_STATUS_CODES.includes(
      status as (typeof MODEL_FALLBACK_STATUS_CODES)[number]
    )
  ) {
    return false;
  }
  const lower = message.toLowerCase();
  return MODEL_ERROR_PATTERNS.some((pattern) => lower.includes(pattern));
}

export function createApiError(
  provider: ProviderId,
  model: string,
  res: HttpResult<unknown>,
  elapsed_ms: number
): ProviderFailure {
  return {
    kind: "failure",
    failureType: "api_error",
    provider,
    model,
    message: extractErrorMessage(res),
    status: res.status,
    details: res.data ?? res.text,
    elapsed_ms,
  };
}

export function createSuccess(
  provider: ProviderId,
  model: string,
  text: string,
  raw: unknown,
  elapsed_ms: number
): import("../types/index.js").ProviderSuccess {
  const tokens = extractTokens(provider, raw);
  return {
    kind: "success",
    provider,
    model,
    text: text || "(empty response)",
    raw,
    elapsed_ms,
    tokens,
  };
}

export interface ProviderSpec {
  providerId: ProviderId;
  apiKeyEnvVar: string;
  getEndpoint: (model: string, apiKey: string) => string;
  getHeaders: (apiKey: string) => Record<string, string>;
  buildBody: (model: string, prompt: string, cfg: ProviderRunConfig) => Record<string, unknown>;
  extractText: (payload: unknown) => string;
  postJson?: typeof postJson;
}

export async function runWithFallback(
  prompt: string,
  cfg: ProviderRunConfig,
  spec: ProviderSpec
): Promise<ProviderResponse> {
  const apiKey = process.env[spec.apiKeyEnvVar];
  const started = Date.now();

  if (!apiKey) {
    return createApiKeyMissingError(spec.providerId, spec.apiKeyEnvVar, Date.now() - started);
  }

  const models = asModelList(cfg.model);
  let lastErr: ProviderResponse | null = null;
  const timeoutMs = cfg.timeout_ms ?? DEFAULT_TIMEOUT_MS;
  const post = spec.postJson ?? postJson;

  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    const url = spec.getEndpoint(model, apiKey);
    const headers = spec.getHeaders(apiKey);
    const body = spec.buildBody(model, prompt, cfg);

    const res = await post<unknown>(url, headers, body, timeoutMs);
    const elapsed = Date.now() - started;

    if (res.isTimeout) {
      return createTimeoutError(spec.providerId, model, timeoutMs, elapsed);
    }

    if (!res.ok) {
      lastErr = createApiError(spec.providerId, model, res, elapsed);
      if (shouldTryNextModel(lastErr.message, res.status, models.length - i - 1)) {
        continue;
      }
      return lastErr;
    }

    return createSuccess(spec.providerId, model, spec.extractText(res.data), res.data, elapsed);
  }

  return (
    lastErr ?? {
      kind: "failure",
      failureType: "api_error",
      provider: spec.providerId,
      message: "All models failed. Check API key and network.",
      elapsed_ms: Date.now() - started,
    }
  );
}

import { PROVIDER_IDS } from "../constants.js";

export type ProviderId = (typeof PROVIDER_IDS)[number];

export type ProviderStatus = "idle" | "loading" | "done" | "error" | "skipped";

export type FailureType = "api_key_missing" | "api_error" | "timeout" | "disabled";

export interface TokenUsage {
  readonly input_tokens?: number;
  readonly output_tokens?: number;
}

export interface ProviderSuccess {
  readonly kind: "success";
  readonly provider: ProviderId;
  readonly model: string;
  readonly text: string;
  readonly raw?: unknown;
  readonly elapsed_ms: number;
  readonly tokens?: TokenUsage;
}

export interface ProviderFailure {
  readonly kind: "failure";
  readonly failureType: FailureType;
  readonly provider: ProviderId;
  readonly model?: string;
  readonly message: string;
  readonly status?: number;
  readonly details?: unknown;
  readonly elapsed_ms: number;
}

export type ProviderResponse = ProviderSuccess | ProviderFailure;

export function isProviderSuccess(r: ProviderResponse): r is ProviderSuccess {
  return r.kind === "success";
}

export function isProviderFailure(r: ProviderResponse): r is ProviderFailure {
  return r.kind === "failure";
}

export function createDisabledError(provider: ProviderId): ProviderFailure {
  return {
    kind: "failure",
    failureType: "disabled",
    provider,
    message: "Disabled. Set 'enabled: true' in llm-comp.yaml",
    elapsed_ms: 0,
  };
}

const API_KEY_HINTS: Record<string, string> = {
  OPENAI_API_KEY: "sk-...",
  ANTHROPIC_API_KEY: "sk-ant-...",
  GEMINI_API_KEY: "AI...",
};

export function createApiKeyMissingError(
  provider: ProviderId,
  envVarName: string,
  elapsed_ms: number
): ProviderFailure {
  const hint = API_KEY_HINTS[envVarName] ?? "...";
  return {
    kind: "failure",
    failureType: "api_key_missing",
    provider,
    message: `Missing ${envVarName}. Add to .env: ${envVarName}=${hint}`,
    elapsed_ms,
  };
}

export function createTimeoutError(
  provider: ProviderId,
  model: string,
  timeoutMs: number,
  elapsed_ms: number
): ProviderFailure {
  const secs = Math.round(timeoutMs / 1000);
  return {
    kind: "failure",
    failureType: "timeout",
    provider,
    model,
    message: `Timed out after ${secs}s. Increase app.timeout_ms in config.`,
    elapsed_ms,
  };
}

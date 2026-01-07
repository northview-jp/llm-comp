import {
  ProviderId,
  ProviderResponse,
  ProviderRunConfig,
  createDisabledError,
} from "../types/index.js";
import { PROVIDER_IDS } from "../constants.js";
import { runOpenAI } from "./openai.js";
import { runClaude } from "./claude.js";
import { runGemini } from "./gemini.js";

type ProviderRunner = (
  prompt: string,
  cfg: ProviderRunConfig
) => Promise<ProviderResponse>;

const PROVIDER_RUNNERS: Record<ProviderId, ProviderRunner> = {
  openai: runOpenAI,
  claude: runClaude,
  gemini: runGemini,
};

export async function runProvider(
  provider: ProviderId,
  prompt: string,
  cfg: ProviderRunConfig,
  enabled: boolean
): Promise<ProviderResponse> {
  if (!enabled) {
    return createDisabledError(provider);
  }
  return PROVIDER_RUNNERS[provider](prompt, cfg);
}

export async function runAll(
  prompt: string,
  configs: Record<ProviderId, ProviderRunConfig>,
  enabled: Record<ProviderId, boolean>
): Promise<ProviderResponse[]> {
  const safeRun = async (
    id: ProviderId,
    fn: () => Promise<ProviderResponse>
  ): Promise<ProviderResponse> => {
    const started = Date.now();
    try {
      return await fn();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        kind: "failure",
        failureType: "api_error",
        provider: id,
        message: msg,
        elapsed_ms: Date.now() - started,
      };
    }
  };

  const tasks = PROVIDER_IDS.map((id) =>
    enabled[id]
      ? safeRun(id, () => runProvider(id, prompt, configs[id], true))
      : Promise.resolve(createDisabledError(id))
  );

  return Promise.all(tasks);
}

export async function runProviderWithModel(
  providerId: ProviderId,
  modelId: string,
  prompt: string,
  baseCfg: ProviderRunConfig
): Promise<ProviderResponse> {
  const cfg: ProviderRunConfig = {
    ...baseCfg,
    model: modelId,
  };
  return PROVIDER_RUNNERS[providerId](prompt, cfg);
}

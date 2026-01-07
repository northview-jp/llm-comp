import { AppConfig } from "../types/index.js";
import {
  DEFAULT_TIMEOUT_MS,
  DEFAULT_TEMPERATURE,
  DEFAULT_MAX_OUTPUT_TOKENS,
} from "../constants.js";
import { getDefaultModels, getProviderDisplayName } from "../catalog/index.js";

export const DEFAULT_CONFIG: AppConfig = {
  app: {
    title: "llm-comp",
    system: "You are a helpful assistant.",
    timeout_ms: DEFAULT_TIMEOUT_MS,
  },
  providers: {
    openai: {
      enabled: true,
      model: getDefaultModels("openai"),
      temperature: DEFAULT_TEMPERATURE,
      max_output_tokens: DEFAULT_MAX_OUTPUT_TOKENS,
    },
    claude: {
      enabled: true,
      model: getDefaultModels("claude"),
      temperature: DEFAULT_TEMPERATURE,
      max_output_tokens: DEFAULT_MAX_OUTPUT_TOKENS,
    },
    gemini: {
      enabled: true,
      model: getDefaultModels("gemini"),
      temperature: DEFAULT_TEMPERATURE,
      max_output_tokens: DEFAULT_MAX_OUTPUT_TOKENS,
    },
  },
  ui: {
    mode: "tabbed",
    tab_labels: {
      openai: getProviderDisplayName("openai"),
      claude: getProviderDisplayName("claude"),
      gemini: getProviderDisplayName("gemini"),
    },
  },
};

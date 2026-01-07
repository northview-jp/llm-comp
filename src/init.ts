import fs from "fs";
import path from "path";
import { MODEL_CATALOG, getDefaultModels, getProviderDisplayName } from "./catalog/index.js";
import {
  DEFAULT_TIMEOUT_MS,
  DEFAULT_TEMPERATURE,
  DEFAULT_MAX_OUTPUT_TOKENS,
} from "./constants.js";

function generateYamlTemplate(): string {
  const openaiModels = JSON.stringify(getDefaultModels("openai"));
  const claudeModels = JSON.stringify(getDefaultModels("claude"));
  const geminiModels = JSON.stringify(getDefaultModels("gemini"));

  return `# llm-comp.yaml
# Edit this file to customize the behavior.

app:
  title: "llm-comp"
  system: |
    You are a helpful assistant.
  timeout_ms: ${DEFAULT_TIMEOUT_MS}

providers:
  openai:
    enabled: true
    # Models can be specified as an array (tried in order from first to last)
    model: ${openaiModels}
    temperature: ${DEFAULT_TEMPERATURE}
    max_output_tokens: ${DEFAULT_MAX_OUTPUT_TOKENS}

  claude:
    enabled: true
    model: ${claudeModels}
    temperature: ${DEFAULT_TEMPERATURE}
    max_output_tokens: ${DEFAULT_MAX_OUTPUT_TOKENS}

  gemini:
    enabled: true
    model: ${geminiModels}
    temperature: ${DEFAULT_TEMPERATURE}
    max_output_tokens: ${DEFAULT_MAX_OUTPUT_TOKENS}

ui:
  mode: "tabbed" # tabbed | json
  tab_labels:
    openai: "${getProviderDisplayName("openai")}"
    claude: "${getProviderDisplayName("claude")}"
    gemini: "${getProviderDisplayName("gemini")}"
`;
}

const ENV_TEMPLATE = `# .env
# Auto-loaded from current directory. Set LLM_COMP_SKIP_DOTENV=1 to disable.
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GEMINI_API_KEY=
`;

export function initProjectFiles(cwd: string): { created: string[]; skipped: string[] } {
  const created: string[] = [];
  const skipped: string[] = [];

  const yamlPath = path.join(cwd, "llm-comp.yaml");
  if (!fs.existsSync(yamlPath)) {
    fs.writeFileSync(yamlPath, generateYamlTemplate(), "utf8");
    created.push("./llm-comp.yaml");
  } else {
    skipped.push("./llm-comp.yaml");
  }

  const envPath = path.join(cwd, ".env");
  if (!fs.existsSync(envPath)) {
    fs.writeFileSync(envPath, ENV_TEMPLATE, { encoding: "utf8", mode: 0o600 });
    created.push("./.env");
  } else {
    skipped.push("./.env");
  }

  return { created, skipped };
}

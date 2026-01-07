import fs from "fs";
import os from "os";
import path from "path";
import YAML from "yaml";
import { AppConfig, ProviderRunConfig } from "../types/index.js";
import {
  DEFAULT_TIMEOUT_MS,
  DEFAULT_TEMPERATURE,
  DEFAULT_MAX_OUTPUT_TOKENS,
  ENV_CONFIG_PATH,
} from "../constants.js";
import { clone, deepMerge } from "./merge.js";
import { DEFAULT_CONFIG } from "./defaults.js";

export interface ResolvedConfig {
  config: AppConfig;
  source: { kind: "default" | "file"; path?: string };
}

export function resolveConfig(cwd: string): ResolvedConfig {
  const envPath = process.env[ENV_CONFIG_PATH];
  const candidates: string[] = [];

  if (envPath?.trim()) candidates.push(envPath.trim());

  candidates.push(path.join(cwd, "llm-comp.yaml"));
  candidates.push(path.join(cwd, "llm-comp.yml"));

  const xdg = process.env.XDG_CONFIG_HOME;
  const globalBase = xdg?.trim() || path.join(os.homedir(), ".config");

  candidates.push(path.join(globalBase, "llm-comp", "config.yaml"));
  candidates.push(path.join(globalBase, "llm-comp", "config.yml"));

  for (const p of candidates) {
    if (!p) continue;
    if (fs.existsSync(p) && fs.statSync(p).isFile()) {
      const text = fs.readFileSync(p, "utf8");
      const parsed = YAML.parse(text) as unknown;
      const merged = deepMerge(clone(DEFAULT_CONFIG), parsed);

      normalizeProvider(merged.providers.openai, merged.app);
      normalizeProvider(merged.providers.claude, merged.app);
      normalizeProvider(merged.providers.gemini, merged.app);

      if (!merged.ui?.tab_labels) {
        merged.ui.tab_labels = DEFAULT_CONFIG.ui.tab_labels;
      }
      merged.ui.mode = merged.ui.mode ?? DEFAULT_CONFIG.ui.mode;

      return { config: merged, source: { kind: "file", path: p } };
    }
  }

  return { config: clone(DEFAULT_CONFIG), source: { kind: "default" } };
}

function normalizeProvider(p: ProviderRunConfig, app: AppConfig["app"]): void {
  if (p.enabled === undefined) p.enabled = true;
  if (!p.model) p.model = "unknown";
  if (p.temperature === undefined) p.temperature = DEFAULT_TEMPERATURE;
  if (p.max_output_tokens === undefined) p.max_output_tokens = DEFAULT_MAX_OUTPUT_TOKENS;

  if (p.system === undefined) p.system = app.system;
  if (p.timeout_ms === undefined) p.timeout_ms = app.timeout_ms;
}

export function configHelpText(resolved: ResolvedConfig): string {
  if (resolved.source.kind === "file") {
    return `Config: ${resolved.source.path}`;
  }
  return "Config: (built-in defaults; place ./llm-comp.yaml to customize)";
}

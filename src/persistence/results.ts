import fs from "fs";
import path from "path";
import yaml from "yaml";
import { ProviderState } from "../types/index.js";

interface ResultEntry {
  provider: string;
  model: string;
  status: string;
  elapsed_ms: number;
  tokens?: { input?: number; output?: number };
  text?: string;
  error?: string;
  raw?: unknown;
}

interface SavedResults {
  prompt: string;
  executedAt: string;
  results: ResultEntry[];
}

const RESULTS_FILE = ".latest-results.yaml";

export function saveResults(
  cwd: string,
  prompt: string,
  states: Map<string, ProviderState>
): void {
  const results: ResultEntry[] = [];

  for (const [tabId, state] of states) {
    const [provider, ...modelParts] = tabId.split(":");
    const model = modelParts.join(":");
    const entry: ResultEntry = {
      provider,
      model,
      status: state.status,
      elapsed_ms: state.elapsed_ms ?? 0,
    };

    if (state.status === "done") {
      entry.text = state.text;
      if (state.tokens) {
        entry.tokens = {
          input: state.tokens.input_tokens,
          output: state.tokens.output_tokens,
        };
      }
      if (state.raw !== undefined) {
        entry.raw = state.raw;
      }
    } else if (state.status === "error" || state.status === "skipped") {
      entry.error = state.error;
    }

    results.push(entry);
  }

  const data: SavedResults = {
    prompt,
    executedAt: new Date().toISOString(),
    results,
  };

  const filePath = path.join(cwd, RESULTS_FILE);
  fs.writeFileSync(filePath, yaml.stringify(data), "utf8");
}

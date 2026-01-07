import { ENV_SKIP_DOTENV } from "./constants.js";

export function shouldSkipDotEnv(): boolean {
  const raw = process.env[ENV_SKIP_DOTENV];
  if (!raw) return false;
  const v = raw.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes" || v === "y" || v === "on";
}

export function getHelpText(): string {
  return `
llm-comp - Compare LLM responses in a tabbed UI

Usage:
  llm-comp "your prompt"
  llm-comp init

Notes:
  - Config: ./llm-comp.yaml (preferred) or ~/.config/llm-comp/config.yaml
  - API keys: ./.env (auto-loaded) or environment variables
  - UI: Select models → Confirm → View results in tabs
`.trim();
}

export function parseArgs(argv: string[]): { command?: string; prompt: string } {
  if (argv.length === 0) {
    return { prompt: "" };
  }

  if (argv[0] === "init") {
    return { command: "init", prompt: "" };
  }

  return { prompt: argv.join(" ").trim() };
}

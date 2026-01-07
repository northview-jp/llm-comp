import { render } from "ink";
import { loadDotEnv } from "./env.js";
import { resolveConfig } from "./config/index.js";
import { initProjectFiles } from "./init.js";
import { runAll, runProviderWithModel } from "./providers/registry.js";
import { ProviderId, ProviderState } from "./types/index.js";
import { shouldSkipDotEnv, getHelpText } from "./cli-helpers.js";
import { printJson } from "./ui/json.js";
import { MODEL_CATALOG } from "./catalog/index.js";
import { SelectedModel } from "./ui/selector/index.js";
import { loadSelection, saveSelection, saveResults } from "./persistence/index.js";
import { App } from "./ui/ink/App.js";

function printHelp(): void {
  process.stdout.write(getHelpText() + "\n");
}

async function readStdin(): Promise<string> {
  return new Promise((resolve) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => (data += chunk));
    process.stdin.on("end", () => resolve(data.trim()));
  });
}

async function main(): Promise<void> {
  const cwd = process.cwd();
  if (!shouldSkipDotEnv()) {
    loadDotEnv(cwd);
  }

  const argv = process.argv.slice(2);

  if (argv.length === 0 && process.stdin.isTTY) {
    printHelp();
    process.exit(1);
  }

  if (argv[0] === "init") {
    const r = initProjectFiles(cwd);
    if (r.created.length) {
      process.stdout.write(
        "Created:\n" + r.created.map((s) => `  - ${s}`).join("\n") + "\n"
      );
    }
    if (r.skipped.length) {
      process.stdout.write(
        "Skipped (already exists):\n" +
          r.skipped.map((s) => `  - ${s}`).join("\n") +
          "\n"
      );
    }
    process.stdout.write("\nNext: Add your API keys to .env\n");
    process.exit(0);
  }

  let prompt = argv.join(" ").trim();
  if (!prompt && !process.stdin.isTTY) {
    prompt = await readStdin();
  }

  if (!prompt) {
    printHelp();
    process.exit(1);
  }

  const resolved = resolveConfig(cwd);
  const cfg = resolved.config;

  // JSON mode or non-TTY: use old behavior with config defaults
  if (cfg.ui.mode === "json" || !process.stdout.isTTY) {
    const enabled: Record<ProviderId, boolean> = {
      openai: !!cfg.providers.openai.enabled,
      claude: !!cfg.providers.claude.enabled,
      gemini: !!cfg.providers.gemini.enabled,
    };
    const results = await runAll(prompt, cfg.providers, enabled);
    printJson(results);
    return;
  }

  // Interactive mode: use Ink-based UI
  const defaultSelections = loadSelection(cwd);

  const runProvider = async (model: SelectedModel) => {
    return runProviderWithModel(
      model.providerId,
      model.modelId,
      prompt,
      cfg.providers[model.providerId]
    );
  };

  const handleComplete = (states: Map<string, unknown>) => {
    saveResults(cwd, prompt, states as Map<string, ProviderState>);
  };

  const handleSelectionSave = (models: SelectedModel[]) => {
    saveSelection(
      cwd,
      models.map((m) => ({ providerId: m.providerId, modelId: m.modelId }))
    );
  };

  const handleQuit = () => {
    process.exit(0);
  };

  const { waitUntilExit } = render(
    <App
      catalog={MODEL_CATALOG}
      defaultSelections={defaultSelections}
      prompt={prompt}
      title={cfg.app.title}
      runProvider={runProvider}
      onComplete={handleComplete}
      onSelectionSave={handleSelectionSave}
      onQuit={handleQuit}
    />
  );

  await waitUntilExit();
}

main().catch((e) => {
  const msg = e instanceof Error ? e.stack || e.message : String(e);
  process.stderr.write(msg + "\n");
  process.exit(1);
});

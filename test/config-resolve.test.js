import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import yaml from "yaml";

import { resolveConfig, configHelpText } from "../dist/config/index.js";
import { DEFAULT_CONFIG } from "../dist/config/defaults.js";

function withTempDir(fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "llm-comp-test-"));
  try {
    return fn(dir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function withEnv(vars, fn) {
  const previous = {};
  for (const key of Object.keys(vars)) {
    previous[key] = process.env[key];
    const value = vars[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
  try {
    return fn();
  } finally {
    for (const key of Object.keys(previous)) {
      const value = previous[key];
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

test("resolveConfig falls back to defaults when no config files exist", () => {
  withTempDir((dir) => {
    withEnv({ LLM_COMP_CONFIG: "", XDG_CONFIG_HOME: dir }, () => {
      const resolved = resolveConfig(dir);

      assert.equal(resolved.source.kind, "default");
      assert.equal(resolved.config.app.title, DEFAULT_CONFIG.app.title);
      assert.equal(resolved.config.providers.openai.enabled, true);
    });
  });
});

test("resolveConfig merges file config and normalizes providers", () => {
  withTempDir((dir) => {
    const config = {
      app: { system: "System test", timeout_ms: 1234 },
      providers: {
        openai: { model: "gpt-4.1", temperature: 0.2 },
        claude: { enabled: false },
      },
      ui: { tab_labels: null },
    };
    fs.writeFileSync(
      path.join(dir, "llm-comp.yaml"),
      yaml.stringify(config),
      "utf8"
    );

    withEnv({ LLM_COMP_CONFIG: "", XDG_CONFIG_HOME: dir }, () => {
      const resolved = resolveConfig(dir);

      assert.equal(resolved.source.kind, "file");
      assert.equal(resolved.source.path, path.join(dir, "llm-comp.yaml"));

      const openai = resolved.config.providers.openai;
      assert.equal(openai.model, "gpt-4.1");
      assert.equal(openai.temperature, 0.2);
      assert.equal(openai.system, "System test");
      assert.equal(openai.timeout_ms, 1234);
      assert.equal(
        openai.max_output_tokens,
        DEFAULT_CONFIG.providers.openai.max_output_tokens
      );

      const claude = resolved.config.providers.claude;
      assert.equal(claude.enabled, false);

      assert.deepEqual(
        resolved.config.ui.tab_labels,
        DEFAULT_CONFIG.ui.tab_labels
      );

      assert.equal(
        configHelpText(resolved),
        `Config: ${path.join(dir, "llm-comp.yaml")}`
      );
    });
  });
});

test("configHelpText reports default source", () => {
  const help = configHelpText({
    config: DEFAULT_CONFIG,
    source: { kind: "default" },
  });

  assert.equal(
    help,
    "Config: (built-in defaults; place ./llm-comp.yaml to customize)"
  );
});

import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import yaml from "yaml";

import { loadSelection, saveSelection } from "../dist/persistence/selection.js";
import { saveResults } from "../dist/persistence/results.js";

function withTempDir(fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "llm-comp-test-"));
  try {
    return fn(dir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

test("loadSelection returns empty set when file is missing", () => {
  withTempDir((dir) => {
    const loaded = loadSelection(dir);
    assert.equal(loaded.size, 0);
  });
});

test("saveSelection and loadSelection round trip", () => {
  withTempDir((dir) => {
    const models = [
      { providerId: "openai", modelId: "gpt-4.1" },
      { providerId: "claude", modelId: "claude-haiku" },
    ];

    saveSelection(dir, models);

    const loaded = loadSelection(dir);
    assert.deepEqual(
      [...loaded].sort(),
      ["openai:gpt-4.1", "claude:claude-haiku"].sort()
    );

    const raw = JSON.parse(
      fs.readFileSync(path.join(dir, ".llm-comp-selection.json"), "utf8")
    );
    assert.deepEqual(raw.selectedModels, models);
    assert.ok(!Number.isNaN(Date.parse(raw.updatedAt)));
  });
});

test("loadSelection handles invalid json", () => {
  withTempDir((dir) => {
    fs.writeFileSync(path.join(dir, ".llm-comp-selection.json"), "{", "utf8");
    const loaded = loadSelection(dir);
    assert.equal(loaded.size, 0);
  });
});

test("saveResults writes expected yaml format", () => {
  withTempDir((dir) => {
    const states = new Map([
      [
        "openai:gpt-4.1",
        {
          status: "done",
          label: "OpenAI",
          model: "gpt-4.1",
          text: "hello",
          elapsed_ms: 12,
          tokens: { input_tokens: 3, output_tokens: 4 },
        },
      ],
      [
        "claude:haiku",
        {
          status: "error",
          label: "Claude",
          error: "boom",
          elapsed_ms: 5,
        },
      ],
    ]);

    saveResults(dir, "Say hi", states);

    const parsed = yaml.parse(
      fs.readFileSync(path.join(dir, ".latest-results.yaml"), "utf8")
    );

    assert.equal(parsed.prompt, "Say hi");
    assert.ok(!Number.isNaN(Date.parse(parsed.executedAt)));
    assert.equal(parsed.results.length, 2);

    const openai = parsed.results.find((r) => r.provider === "openai");
    assert.equal(openai.model, "gpt-4.1");
    assert.equal(openai.status, "done");
    assert.equal(openai.elapsed_ms, 12);
    assert.equal(openai.text, "hello");
    assert.deepEqual(openai.tokens, { input: 3, output: 4 });

    const claude = parsed.results.find((r) => r.provider === "claude");
    assert.equal(claude.status, "error");
    assert.equal(claude.elapsed_ms, 5);
    assert.equal(claude.error, "boom");
  });
});

test("saveResults handles skipped status", () => {
  withTempDir((dir) => {
    const states = new Map([
      [
        "openai:gpt-4",
        {
          status: "skipped",
          label: "OpenAI",
          error: "API key missing",
          elapsed_ms: 0,
        },
      ],
    ]);

    saveResults(dir, "Test prompt", states);

    const parsed = yaml.parse(
      fs.readFileSync(path.join(dir, ".latest-results.yaml"), "utf8")
    );

    const result = parsed.results[0];
    assert.equal(result.status, "skipped");
    assert.equal(result.error, "API key missing");
    assert.equal(result.elapsed_ms, 0);
  });
});

test("saveResults handles idle/loading status", () => {
  withTempDir((dir) => {
    const states = new Map([
      [
        "gemini:gemini-2",
        {
          status: "idle",
          label: "Gemini",
        },
      ],
      [
        "claude:claude-3",
        {
          status: "loading",
          label: "Claude",
        },
      ],
    ]);

    saveResults(dir, "Test prompt", states);

    const parsed = yaml.parse(
      fs.readFileSync(path.join(dir, ".latest-results.yaml"), "utf8")
    );

    const gemini = parsed.results.find((r) => r.provider === "gemini");
    assert.equal(gemini.status, "idle");
    assert.equal(gemini.elapsed_ms, 0);

    const claude = parsed.results.find((r) => r.provider === "claude");
    assert.equal(claude.status, "loading");
  });
});

test("saveResults handles done status without tokens", () => {
  withTempDir((dir) => {
    const states = new Map([
      [
        "openai:gpt-4",
        {
          status: "done",
          label: "OpenAI",
          text: "response without tokens",
          elapsed_ms: 100,
        },
      ],
    ]);

    saveResults(dir, "Test prompt", states);

    const parsed = yaml.parse(
      fs.readFileSync(path.join(dir, ".latest-results.yaml"), "utf8")
    );

    const result = parsed.results[0];
    assert.equal(result.status, "done");
    assert.equal(result.text, "response without tokens");
    assert.equal(result.tokens, undefined);
  });
});

test("saveResults handles raw field", () => {
  withTempDir((dir) => {
    const rawData = { output_text: "raw response", usage: { tokens: 100 } };
    const states = new Map([
      [
        "openai:gpt-4",
        {
          status: "done",
          label: "OpenAI",
          text: "response",
          elapsed_ms: 50,
          raw: rawData,
        },
      ],
    ]);

    saveResults(dir, "Test prompt", states);

    const parsed = yaml.parse(
      fs.readFileSync(path.join(dir, ".latest-results.yaml"), "utf8")
    );

    const result = parsed.results[0];
    assert.deepEqual(result.raw, rawData);
  });
});

test("saveResults handles model ID with colons", () => {
  withTempDir((dir) => {
    const states = new Map([
      [
        "claude:claude-opus-4-5-20251101",
        {
          status: "done",
          label: "Claude",
          text: "response",
          elapsed_ms: 100,
        },
      ],
    ]);

    saveResults(dir, "Test prompt", states);

    const parsed = yaml.parse(
      fs.readFileSync(path.join(dir, ".latest-results.yaml"), "utf8")
    );

    const result = parsed.results[0];
    assert.equal(result.provider, "claude");
    assert.equal(result.model, "claude-opus-4-5-20251101");
  });
});

test("saveResults handles empty states", () => {
  withTempDir((dir) => {
    const states = new Map();

    saveResults(dir, "Test prompt", states);

    const parsed = yaml.parse(
      fs.readFileSync(path.join(dir, ".latest-results.yaml"), "utf8")
    );

    assert.equal(parsed.prompt, "Test prompt");
    assert.deepEqual(parsed.results, []);
  });
});

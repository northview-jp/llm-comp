import { describe, it } from "node:test";
import assert from "node:assert";
import { renderSelectionScreen, renderConfirmScreen } from "../../dist/ui/selector/render.js";
import { stripAnsi } from "../../dist/utils/term.js";

function createTestState(overrides = {}) {
  return {
    cursorProvider: 0,
    cursorModel: -1,
    expanded: new Set(["openai"]),
    providers: [
      {
        providerId: "openai",
        models: [
          { id: "gpt-4", displayName: "GPT-4", selected: false, tier: "flagship" },
          { id: "gpt-3.5", displayName: "GPT-3.5", selected: true, tier: "standard" },
        ],
      },
      {
        providerId: "claude",
        models: [
          { id: "claude-3", displayName: "Claude 3", selected: false, tier: "flagship" },
        ],
      },
    ],
    errorMessage: null,
    ...overrides,
  };
}

describe("selector/render", () => {
  describe("renderSelectionScreen", () => {
    it("returns a string", () => {
      const state = createTestState();
      const result = renderSelectionScreen(state, 80, 24);
      assert.strictEqual(typeof result, "string");
    });

    it("starts with clear screen escape sequence", () => {
      const state = createTestState();
      const result = renderSelectionScreen(state, 80, 24);
      assert.ok(result.startsWith("\x1b[2J\x1b[H"));
    });

    it("includes title text", () => {
      const state = createTestState();
      const result = renderSelectionScreen(state, 80, 24);
      const stripped = stripAnsi(result);
      assert.ok(stripped.includes("LLM Comparison"));
    });

    it("includes subtitle text", () => {
      const state = createTestState();
      const result = renderSelectionScreen(state, 80, 24);
      const stripped = stripAnsi(result);
      assert.ok(stripped.includes("Select models"));
    });

    it("includes provider names", () => {
      const state = createTestState();
      const result = renderSelectionScreen(state, 80, 24);
      const stripped = stripAnsi(result);
      assert.ok(stripped.includes("OpenAI"));
      assert.ok(stripped.includes("Claude"));
    });

    it("shows models when provider is expanded", () => {
      const state = createTestState({ expanded: new Set(["openai"]) });
      const result = renderSelectionScreen(state, 80, 24);
      const stripped = stripAnsi(result);
      assert.ok(stripped.includes("GPT-4"));
      assert.ok(stripped.includes("GPT-3.5"));
    });

    it("hides models when provider is collapsed", () => {
      const state = createTestState({ expanded: new Set() });
      const result = renderSelectionScreen(state, 80, 24);
      const stripped = stripAnsi(result);
      // Should show provider but not models
      assert.ok(stripped.includes("OpenAI"));
      // GPT-4 should not appear since openai is collapsed
      assert.ok(!stripped.includes("GPT-4"));
    });

    it("shows selection count", () => {
      const state = createTestState();
      state.providers[0].models[0].selected = true;
      state.providers[0].models[1].selected = true;
      const result = renderSelectionScreen(state, 80, 24);
      const stripped = stripAnsi(result);
      // Should show "2/2" for openai
      assert.ok(stripped.includes("2/2"));
    });

    it("shows error message when present", () => {
      const state = createTestState({ errorMessage: "Max 4 models per provider" });
      const result = renderSelectionScreen(state, 80, 24);
      const stripped = stripAnsi(result);
      assert.ok(stripped.includes("Max 4 models per provider"));
    });

    it("shows no models selected message when none selected", () => {
      const state = createTestState();
      state.providers[0].models[0].selected = false;
      state.providers[0].models[1].selected = false;
      const result = renderSelectionScreen(state, 80, 24);
      const stripped = stripAnsi(result);
      assert.ok(stripped.includes("No models selected"));
    });

    it("shows singular model selected message", () => {
      const state = createTestState();
      state.providers[0].models[0].selected = false;
      state.providers[0].models[1].selected = true;
      const result = renderSelectionScreen(state, 80, 24);
      const stripped = stripAnsi(result);
      assert.ok(stripped.includes("1") && stripped.includes("model selected"));
    });

    it("shows plural models selected message", () => {
      const state = createTestState();
      state.providers[0].models[0].selected = true;
      state.providers[0].models[1].selected = true;
      const result = renderSelectionScreen(state, 80, 24);
      const stripped = stripAnsi(result);
      assert.ok(stripped.includes("2") && stripped.includes("models selected"));
    });

    it("includes keyboard hints", () => {
      const state = createTestState();
      const result = renderSelectionScreen(state, 80, 24);
      const stripped = stripAnsi(result);
      assert.ok(stripped.includes("SPACE"));
      assert.ok(stripped.includes("ENTER"));
    });

    it("respects width parameter", () => {
      const state = createTestState();
      const result = renderSelectionScreen(state, 40, 24);
      const lines = result.split("\n");
      // All lines should be within width
      for (const line of lines) {
        const stripped = stripAnsi(line);
        assert.ok(stripped.length <= 40, `Line too long: ${stripped.length}`);
      }
    });

    it("respects height parameter", () => {
      const state = createTestState();
      const result = renderSelectionScreen(state, 80, 20);
      const lines = result.split("\n");
      // Should have approximately height lines (minus some for margins)
      assert.ok(lines.length >= 15);
    });

    it("handles small terminal width", () => {
      const state = createTestState();
      // Should not throw for small width
      const result = renderSelectionScreen(state, 20, 24);
      assert.ok(typeof result === "string");
    });
  });

  describe("renderConfirmScreen", () => {
    const testModels = [
      { providerId: "openai", modelId: "gpt-4", displayName: "GPT-4" },
      { providerId: "claude", modelId: "claude-3", displayName: "Claude 3" },
    ];

    it("returns a string", () => {
      const result = renderConfirmScreen(testModels, 80, 24);
      assert.strictEqual(typeof result, "string");
    });

    it("starts with clear screen escape sequence", () => {
      const result = renderConfirmScreen(testModels, 80, 24);
      assert.ok(result.startsWith("\x1b[2J\x1b[H"));
    });

    it("includes Ready to Compare header", () => {
      const result = renderConfirmScreen(testModels, 80, 24);
      const stripped = stripAnsi(result);
      assert.ok(stripped.includes("Ready to Compare"));
    });

    it("shows model count", () => {
      const result = renderConfirmScreen(testModels, 80, 24);
      const stripped = stripAnsi(result);
      assert.ok(stripped.includes("2"));
      assert.ok(stripped.includes("models"));
    });

    it("shows singular for one model", () => {
      const singleModel = [{ providerId: "openai", modelId: "gpt-4", displayName: "GPT-4" }];
      const result = renderConfirmScreen(singleModel, 80, 24);
      const stripped = stripAnsi(result);
      assert.ok(stripped.includes("1"));
      assert.ok(stripped.includes("model "));
    });

    it("shows provider names", () => {
      const result = renderConfirmScreen(testModels, 80, 24);
      const stripped = stripAnsi(result);
      assert.ok(stripped.includes("OpenAI"));
      assert.ok(stripped.includes("Claude"));
    });

    it("shows model display names", () => {
      const result = renderConfirmScreen(testModels, 80, 24);
      const stripped = stripAnsi(result);
      assert.ok(stripped.includes("GPT-4"));
      assert.ok(stripped.includes("Claude 3"));
    });

    it("shows Y/N confirmation prompt", () => {
      const result = renderConfirmScreen(testModels, 80, 24);
      const stripped = stripAnsi(result);
      assert.ok(stripped.includes("Y"));
      assert.ok(stripped.includes("N"));
    });

    it("shows Run comparison text", () => {
      const result = renderConfirmScreen(testModels, 80, 24);
      const stripped = stripAnsi(result);
      assert.ok(stripped.includes("Run comparison"));
    });

    it("shows Go back text", () => {
      const result = renderConfirmScreen(testModels, 80, 24);
      const stripped = stripAnsi(result);
      assert.ok(stripped.includes("Go back"));
    });

    it("groups models by provider", () => {
      const models = [
        { providerId: "openai", modelId: "gpt-4", displayName: "GPT-4" },
        { providerId: "openai", modelId: "gpt-3.5", displayName: "GPT-3.5" },
        { providerId: "claude", modelId: "claude-3", displayName: "Claude 3" },
      ];
      const result = renderConfirmScreen(models, 80, 24);
      const stripped = stripAnsi(result);
      // OpenAI should appear before its models
      const openaiIndex = stripped.indexOf("OpenAI");
      const gpt4Index = stripped.indexOf("GPT-4");
      const gpt35Index = stripped.indexOf("GPT-3.5");
      assert.ok(openaiIndex < gpt4Index);
      assert.ok(openaiIndex < gpt35Index);
    });

    it("handles empty models list", () => {
      const result = renderConfirmScreen([], 80, 24);
      const stripped = stripAnsi(result);
      assert.ok(stripped.includes("0"));
    });

    it("respects width parameter", () => {
      const result = renderConfirmScreen(testModels, 40, 24);
      const lines = result.split("\n");
      for (const line of lines) {
        const stripped = stripAnsi(line);
        assert.ok(stripped.length <= 40, `Line too long: ${stripped.length}`);
      }
    });
  });
});

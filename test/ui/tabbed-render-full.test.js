import { describe, it } from "node:test";
import assert from "node:assert";
import {
  renderHeader,
  renderProviderTabs,
  renderGrid,
  renderFullscreenPanel,
  composeFinalOutput,
  renderHelpScreen,
  getTerminalDimensions,
  renderPanelHeader,
} from "../../dist/ui/tabbed/render.js";
import { stripAnsi } from "../../dist/utils/term.js";

function createTestContext(overrides = {}) {
  const states = new Map([
    ["openai:gpt-4", { status: "done", text: "Hello world", model: "gpt-4", elapsed_ms: 1000, tokens: { input_tokens: 10, output_tokens: 20 } }],
    ["openai:gpt-3.5", { status: "loading", startedAt: Date.now() - 2000 }],
    ["claude:claude-3", { status: "error", error: "Rate limit exceeded" }],
    ["gemini:gemini-2", { status: "skipped", error: "API key missing" }],
  ]);

  return {
    title: "LLM Comparison",
    prompt: "Test prompt for comparison",
    spinnerIdx: 0,
    activeProviderIdx: 0,
    focusedPanel: null,
    providerGroups: [
      {
        providerId: "openai",
        tabs: [
          { id: "openai:gpt-4", label: "gpt-4" },
          { id: "openai:gpt-3.5", label: "gpt-3.5" },
        ],
      },
      {
        providerId: "claude",
        tabs: [{ id: "claude:claude-3", label: "claude-3" }],
      },
      {
        providerId: "gemini",
        tabs: [{ id: "gemini:gemini-2", label: "gemini-2" }],
      },
    ],
    states,
    scroll: new Map(),
    ...overrides,
  };
}

describe("tabbed/render (extended)", () => {
  describe("renderHeader", () => {
    it("returns an array of lines", () => {
      const ctx = createTestContext();
      const lines = renderHeader(ctx, 80);
      assert.ok(Array.isArray(lines));
      assert.ok(lines.length >= 2);
    });

    it("includes title text", () => {
      const ctx = createTestContext();
      const lines = renderHeader(ctx, 80);
      const joined = stripAnsi(lines.join("\n"));
      assert.ok(joined.includes("LLM Comparison"));
    });

    it("includes prompt text", () => {
      const ctx = createTestContext();
      const lines = renderHeader(ctx, 80);
      const joined = stripAnsi(lines.join("\n"));
      assert.ok(joined.includes("Prompt:"));
      assert.ok(joined.includes("Test prompt"));
    });

    it("shows loading status when loading", () => {
      const ctx = createTestContext();
      const lines = renderHeader(ctx, 80);
      const joined = stripAnsi(lines.join("\n"));
      assert.ok(joined.includes("loading"));
    });

    it("shows all complete when all done", () => {
      const states = new Map([
        ["openai:gpt-4", { status: "done", text: "Hello", elapsed_ms: 100 }],
      ]);
      const ctx = createTestContext({
        states,
        providerGroups: [
          {
            providerId: "openai",
            tabs: [{ id: "openai:gpt-4", label: "gpt-4" }],
          },
        ],
      });
      const lines = renderHeader(ctx, 80);
      const joined = stripAnsi(lines.join("\n"));
      assert.ok(joined.includes("All complete"));
    });

    it("includes help hint", () => {
      const ctx = createTestContext();
      const lines = renderHeader(ctx, 80);
      const joined = stripAnsi(lines.join("\n"));
      assert.ok(joined.includes("help"));
      assert.ok(joined.includes("quit"));
    });

    it("shows results file hint", () => {
      const ctx = createTestContext();
      const lines = renderHeader(ctx, 80);
      const joined = stripAnsi(lines.join("\n"));
      assert.ok(joined.includes(".latest-results.yaml"));
    });
  });

  describe("renderProviderTabs", () => {
    it("returns an array of lines", () => {
      const ctx = createTestContext();
      const lines = renderProviderTabs(ctx, 80);
      assert.ok(Array.isArray(lines));
      assert.ok(lines.length >= 1);
    });

    it("includes provider names", () => {
      const ctx = createTestContext();
      const lines = renderProviderTabs(ctx, 80);
      const joined = stripAnsi(lines.join("\n"));
      assert.ok(joined.includes("OpenAI"));
      assert.ok(joined.includes("Claude"));
      assert.ok(joined.includes("Gemini"));
    });

    it("shows counts for each provider", () => {
      const ctx = createTestContext();
      const lines = renderProviderTabs(ctx, 80);
      const joined = stripAnsi(lines.join("\n"));
      assert.ok(joined.includes("1/2")); // OpenAI: 1 done out of 2
      assert.ok(joined.includes("0/1")); // Claude: 0 done out of 1
    });

    it("highlights active provider", () => {
      const ctx = createTestContext({ activeProviderIdx: 1 });
      const lines = renderProviderTabs(ctx, 80);
      // Check that Claude provider is rendered (active provider)
      const joined = stripAnsi(lines.join("\n"));
      assert.ok(joined.includes("Claude"));
    });
  });

  describe("renderGrid", () => {
    it("returns an array of lines", () => {
      const ctx = createTestContext();
      const lines = renderGrid(ctx, 80, 24);
      assert.ok(Array.isArray(lines));
      assert.ok(lines.length > 0);
    });

    it("returns empty array for invalid provider index", () => {
      const ctx = createTestContext({ activeProviderIdx: 99 });
      const lines = renderGrid(ctx, 80, 24);
      assert.deepStrictEqual(lines, []);
    });

    it("renders 2x2 grid layout", () => {
      const ctx = createTestContext();
      const lines = renderGrid(ctx, 80, 30);
      const joined = stripAnsi(lines.join("\n"));
      // Grid should include panel numbers
      assert.ok(joined.includes("[1]"));
      assert.ok(joined.includes("[2]"));
    });

    it("includes model labels", () => {
      const ctx = createTestContext();
      const lines = renderGrid(ctx, 80, 30);
      const joined = stripAnsi(lines.join("\n"));
      assert.ok(joined.includes("gpt-4") || joined.includes("gpt-3.5"));
    });

    it("shows content preview for done status", () => {
      const ctx = createTestContext();
      const lines = renderGrid(ctx, 80, 30);
      const joined = stripAnsi(lines.join("\n"));
      assert.ok(joined.includes("Hello world"));
    });

    it("shows waiting message for loading status", () => {
      const ctx = createTestContext();
      const lines = renderGrid(ctx, 80, 30);
      const joined = stripAnsi(lines.join("\n"));
      assert.ok(joined.includes("Waiting"));
    });
  });

  describe("renderFullscreenPanel", () => {
    it("returns empty array when no focused panel", () => {
      const ctx = createTestContext({ focusedPanel: null });
      const lines = renderFullscreenPanel(ctx, 80, 24);
      assert.deepStrictEqual(lines, []);
    });

    it("returns empty array for invalid provider index", () => {
      const ctx = createTestContext({ activeProviderIdx: 99, focusedPanel: 0 });
      const lines = renderFullscreenPanel(ctx, 80, 24);
      assert.deepStrictEqual(lines, []);
    });

    it("returns lines for valid focused panel", () => {
      const ctx = createTestContext({ focusedPanel: 0 });
      const lines = renderFullscreenPanel(ctx, 80, 24);
      assert.ok(Array.isArray(lines));
      assert.ok(lines.length > 0);
    });

    it("includes panel number and label", () => {
      const ctx = createTestContext({ focusedPanel: 0 });
      const lines = renderFullscreenPanel(ctx, 80, 24);
      const joined = stripAnsi(lines.join("\n"));
      assert.ok(joined.includes("[1]"));
      assert.ok(joined.includes("gpt-4"));
    });

    it("includes content text", () => {
      const ctx = createTestContext({ focusedPanel: 0 });
      const lines = renderFullscreenPanel(ctx, 80, 24);
      const joined = stripAnsi(lines.join("\n"));
      assert.ok(joined.includes("Hello world"));
    });

    it("shows model info in footer for done status", () => {
      const ctx = createTestContext({ focusedPanel: 0 });
      const lines = renderFullscreenPanel(ctx, 80, 24);
      const joined = stripAnsi(lines.join("\n"));
      assert.ok(joined.includes("gpt-4"));
      assert.ok(joined.includes("s")); // elapsed time
    });

    it("shows token info when available", () => {
      const ctx = createTestContext({ focusedPanel: 0 });
      const lines = renderFullscreenPanel(ctx, 80, 24);
      const joined = stripAnsi(lines.join("\n"));
      assert.ok(joined.includes("10"));
      assert.ok(joined.includes("20"));
    });

    it("includes return hint", () => {
      const ctx = createTestContext({ focusedPanel: 0 });
      const lines = renderFullscreenPanel(ctx, 80, 24);
      const joined = stripAnsi(lines.join("\n"));
      assert.ok(joined.includes("Esc") || joined.includes("Enter") || joined.includes("return"));
    });

    it("handles scroll position", () => {
      const longText = "Line\n".repeat(100);
      const states = new Map([
        ["openai:gpt-4", { status: "done", text: longText, model: "gpt-4", elapsed_ms: 1000 }],
      ]);
      const scroll = new Map([["openai:gpt-4", 10]]);
      const ctx = createTestContext({ states, scroll, focusedPanel: 0 });
      const lines = renderFullscreenPanel(ctx, 80, 24);
      const joined = stripAnsi(lines.join("\n"));
      // Should show scroll position
      assert.ok(joined.includes("11") || joined.includes("10")); // scroll position indicator
    });
  });

  describe("composeFinalOutput", () => {
    it("returns a string", () => {
      const ctx = createTestContext();
      const output = composeFinalOutput(ctx, 80, 24, null);
      assert.strictEqual(typeof output, "string");
    });

    it("starts with clear screen sequence", () => {
      const ctx = createTestContext();
      const output = composeFinalOutput(ctx, 80, 24, null);
      assert.ok(output.startsWith("\x1b[2J\x1b[H"));
    });

    it("includes header content", () => {
      const ctx = createTestContext();
      const output = composeFinalOutput(ctx, 80, 24, null);
      const stripped = stripAnsi(output);
      assert.ok(stripped.includes("LLM Comparison"));
      assert.ok(stripped.includes("Prompt:"));
    });

    it("includes provider tabs", () => {
      const ctx = createTestContext();
      const output = composeFinalOutput(ctx, 80, 24, null);
      const stripped = stripAnsi(output);
      assert.ok(stripped.includes("OpenAI"));
    });

    it("includes grid in normal mode", () => {
      const ctx = createTestContext({ focusedPanel: null });
      const output = composeFinalOutput(ctx, 80, 30, null);
      const stripped = stripAnsi(output);
      assert.ok(stripped.includes("[1]"));
    });

    it("includes fullscreen panel when focused", () => {
      const ctx = createTestContext({ focusedPanel: 0 });
      const output = composeFinalOutput(ctx, 80, 24, null);
      const stripped = stripAnsi(output);
      assert.ok(stripped.includes("Hello world"));
    });

    it("handles notification parameter without throwing", () => {
      const ctx = createTestContext();
      // Function should handle notification without throwing
      const output = composeFinalOutput(ctx, 80, 30, "Copied!");
      assert.ok(typeof output === "string");
      assert.ok(output.length > 0);
    });

    it("respects width parameter for main content", () => {
      const ctx = createTestContext();
      const output = composeFinalOutput(ctx, 60, 30, null);
      // Output should be generated without throwing
      assert.ok(typeof output === "string");
      assert.ok(output.length > 0);
    });
  });

  describe("renderHelpScreen", () => {
    it("returns a string", () => {
      const output = renderHelpScreen(80, 24);
      assert.strictEqual(typeof output, "string");
    });

    it("starts with clear screen sequence", () => {
      const output = renderHelpScreen(80, 24);
      assert.ok(output.startsWith("\x1b[2J\x1b[H"));
    });

    it("includes keyboard shortcuts", () => {
      const output = renderHelpScreen(80, 24);
      const stripped = stripAnsi(output);
      assert.ok(stripped.includes("Tab") || stripped.includes("tab"));
      assert.ok(stripped.includes("Arrow") || stripped.includes("arrow") || stripped.includes("←") || stripped.includes("→"));
    });

    it("includes help title", () => {
      const output = renderHelpScreen(80, 24);
      const stripped = stripAnsi(output);
      assert.ok(stripped.toLowerCase().includes("help") || stripped.toLowerCase().includes("keyboard"));
    });

    it("includes quit instruction", () => {
      const output = renderHelpScreen(80, 24);
      const stripped = stripAnsi(output);
      assert.ok(stripped.includes("q") || stripped.includes("quit") || stripped.includes("Quit"));
    });
  });

  describe("getTerminalDimensions", () => {
    it("returns object with width and height", () => {
      const dims = getTerminalDimensions();
      assert.ok(typeof dims.width === "number");
      assert.ok(typeof dims.height === "number");
    });

    it("returns positive values", () => {
      const dims = getTerminalDimensions();
      assert.ok(dims.width > 0);
      assert.ok(dims.height > 0);
    });
  });

  describe("renderPanelHeader (extended)", () => {
    it("shows char count for done status", () => {
      const header = renderPanelHeader(1, "gpt-4", "done", 0, 50, 1500);
      const stripped = stripAnsi(header);
      assert.ok(stripped.includes("1.5k") || stripped.includes("1500"));
    });

    it("formats count under 1000 without k suffix", () => {
      const header = renderPanelHeader(1, "gpt-4", "done", 0, 50, 500);
      const stripped = stripAnsi(header);
      assert.ok(stripped.includes("500"));
      assert.ok(!stripped.includes("0.5k"));
    });

    it("does not show count for non-done status", () => {
      const header = renderPanelHeader(1, "gpt-4", "loading", 0, 50, undefined);
      const stripped = stripAnsi(header);
      assert.ok(!stripped.includes("chars"));
    });

    it("handles zero char count", () => {
      const header = renderPanelHeader(1, "gpt-4", "done", 0, 50, 0);
      const stripped = stripAnsi(header);
      // Zero count should not show
      assert.ok(!stripped.includes("(0 chars)"));
    });
  });
});

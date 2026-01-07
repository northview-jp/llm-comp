import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";
import { TabbedController } from "../../dist/ui/tabbed/controller.js";

function createMockClipboard(success = true) {
  const calls = [];
  return {
    calls,
    copy: (text) => {
      calls.push(text);
      return {
        success,
        message: success ? "Copied!" : "Failed to copy",
      };
    },
  };
}

function createTestState(overrides = {}) {
  const defaultProviderGroups = [
    {
      providerId: "openai",
      label: "OpenAI",
      tabs: [
        { id: "openai:gpt-4", model: "gpt-4", label: "GPT-4" },
        { id: "openai:gpt-3.5", model: "gpt-3.5", label: "GPT-3.5" },
      ],
    },
    {
      providerId: "claude",
      label: "Claude",
      tabs: [{ id: "claude:claude-3", model: "claude-3", label: "Claude 3" }],
    },
  ];

  const states = new Map();
  for (const group of defaultProviderGroups) {
    for (const tab of group.tabs) {
      states.set(tab.id, { status: "done", text: "Response text", message: null });
    }
  }

  return {
    title: "Test",
    prompt: "Test prompt",
    providerGroups: defaultProviderGroups,
    activeProviderIdx: 0,
    focusedPanel: null,
    spinnerIdx: 0,
    showHelp: false,
    states,
    scroll: new Map(),
    ...overrides,
  };
}

describe("tabbed/controller", () => {
  let controller;
  let clipboard;

  beforeEach(() => {
    clipboard = createMockClipboard();
    controller = new TabbedController(clipboard);
  });

  describe("quit keys", () => {
    it("returns quit for ctrlC", () => {
      const state = createTestState();
      const result = controller.handleKey(state, "ctrlC");
      assert.strictEqual(result.type, "quit");
    });

    it("returns quit for q", () => {
      const state = createTestState();
      const result = controller.handleKey(state, "q");
      assert.strictEqual(result.type, "quit");
    });
  });

  describe("help screen", () => {
    it("shows help on h key", () => {
      const state = createTestState();
      const result = controller.handleKey(state, "h");
      assert.strictEqual(result.type, "render");
      assert.strictEqual(state.showHelp, true);
    });

    it("shows help on ? key", () => {
      const state = createTestState();
      const result = controller.handleKey(state, "?");
      assert.strictEqual(result.type, "render");
      assert.strictEqual(state.showHelp, true);
    });

    it("dismisses help on any key when help is shown", () => {
      const state = createTestState({ showHelp: true });
      const result = controller.handleKey(state, "x");
      assert.strictEqual(result.type, "render");
      assert.strictEqual(state.showHelp, false);
    });
  });

  describe("grid navigation", () => {
    it("switches to next provider on tab", () => {
      const state = createTestState();
      const result = controller.handleKey(state, "tab");
      assert.strictEqual(result.type, "render");
      assert.strictEqual(state.activeProviderIdx, 1);
    });

    it("switches to next provider on right arrow", () => {
      const state = createTestState();
      const result = controller.handleKey(state, "right");
      assert.strictEqual(result.type, "render");
      assert.strictEqual(state.activeProviderIdx, 1);
    });

    it("wraps around to first provider", () => {
      const state = createTestState({ activeProviderIdx: 1 });
      const result = controller.handleKey(state, "tab");
      assert.strictEqual(result.type, "render");
      assert.strictEqual(state.activeProviderIdx, 0);
    });

    it("switches to previous provider on shiftTab", () => {
      const state = createTestState({ activeProviderIdx: 1 });
      const result = controller.handleKey(state, "shiftTab");
      assert.strictEqual(result.type, "render");
      assert.strictEqual(state.activeProviderIdx, 0);
    });

    it("switches to previous provider on left arrow", () => {
      const state = createTestState({ activeProviderIdx: 1 });
      const result = controller.handleKey(state, "left");
      assert.strictEqual(result.type, "render");
      assert.strictEqual(state.activeProviderIdx, 0);
    });

    it("wraps around to last provider", () => {
      const state = createTestState({ activeProviderIdx: 0 });
      const result = controller.handleKey(state, "shiftTab");
      assert.strictEqual(result.type, "render");
      assert.strictEqual(state.activeProviderIdx, 1);
    });

    it("focuses panel on number key", () => {
      const state = createTestState();
      const result = controller.handleKey(state, "1");
      assert.strictEqual(result.type, "render");
      assert.strictEqual(state.focusedPanel, 0);
    });

    it("focuses second panel on 2 key", () => {
      const state = createTestState();
      const result = controller.handleKey(state, "2");
      assert.strictEqual(result.type, "render");
      assert.strictEqual(state.focusedPanel, 1);
    });

    it("returns none for invalid panel number", () => {
      const state = createTestState();
      const result = controller.handleKey(state, "4");
      assert.strictEqual(result.type, "none");
    });
  });

  describe("fullscreen mode", () => {
    it("exits fullscreen on esc", () => {
      const state = createTestState({ focusedPanel: 0 });
      const result = controller.handleKey(state, "esc");
      assert.strictEqual(result.type, "render");
      assert.strictEqual(state.focusedPanel, null);
    });

    it("exits fullscreen on enter", () => {
      const state = createTestState({ focusedPanel: 0 });
      const result = controller.handleKey(state, "enter");
      assert.strictEqual(result.type, "render");
      assert.strictEqual(state.focusedPanel, null);
    });

    it("switches panels with number keys in fullscreen", () => {
      const state = createTestState({ focusedPanel: 0 });
      const result = controller.handleKey(state, "2");
      assert.strictEqual(result.type, "render");
      assert.strictEqual(state.focusedPanel, 1);
    });

    it("unfocuses when pressing same number key", () => {
      const state = createTestState({ focusedPanel: 0 });
      const result = controller.handleKey(state, "1");
      assert.strictEqual(result.type, "render");
      assert.strictEqual(state.focusedPanel, null);
    });
  });

  describe("copy functionality", () => {
    it("requires panel selection for copy in grid mode", () => {
      const state = createTestState({ focusedPanel: null });
      const result = controller.handleKey(state, "c");
      assert.strictEqual(result.type, "notify");
      assert.ok(result.message.includes("select a panel"));
    });

    it("copies in fullscreen mode", () => {
      const state = createTestState({ focusedPanel: 0 });
      const result = controller.handleKey(state, "c");
      assert.strictEqual(result.type, "notify");
      assert.strictEqual(result.message, "Copied!");
      assert.deepStrictEqual(clipboard.calls, ["Response text"]);
    });

    it("shows status message when copying non-done in fullscreen", () => {
      const state = createTestState({ focusedPanel: 0 });
      state.states.set("openai:gpt-4", { status: "loading" });
      const result = controller.handleKey(state, "c");
      assert.strictEqual(result.type, "notify");
      assert.ok(result.message.includes("loading"));
      assert.deepStrictEqual(clipboard.calls, []);
    });
  });

  describe("unhandled keys", () => {
    it("returns none for unknown key in grid", () => {
      const state = createTestState();
      const result = controller.handleKey(state, "x");
      assert.strictEqual(result.type, "none");
    });
  });
});

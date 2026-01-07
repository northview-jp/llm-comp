import { describe, it } from "node:test";
import assert from "node:assert";
import {
  createInitialState,
  isAllSettled,
  updateFromResult,
  updateFromError,
  createTabId,
  getCurrentProviderTabs,
} from "../../dist/ui/tabbed/state.js";

describe("TabbedUI state management (extended)", () => {
  describe("createInitialState", () => {
    it("creates state with correct title and prompt", () => {
      const state = createInitialState({
        title: "Test Title",
        prompt: "Test prompt",
        models: [
          { providerId: "openai", modelId: "gpt-4", displayName: "GPT-4" },
        ],
      });

      assert.strictEqual(state.title, "Test Title");
      assert.strictEqual(state.prompt, "Test prompt");
    });

    it("groups models by provider", () => {
      const state = createInitialState({
        title: "Test",
        prompt: "Test",
        models: [
          { providerId: "openai", modelId: "gpt-4", displayName: "GPT-4" },
          { providerId: "openai", modelId: "gpt-3.5", displayName: "GPT-3.5" },
          { providerId: "claude", modelId: "claude-3", displayName: "Claude 3" },
        ],
      });

      assert.strictEqual(state.providerGroups.length, 2);
      assert.strictEqual(state.providerGroups[0].providerId, "openai");
      assert.strictEqual(state.providerGroups[0].tabs.length, 2);
      assert.strictEqual(state.providerGroups[1].providerId, "claude");
      assert.strictEqual(state.providerGroups[1].tabs.length, 1);
    });

    it("initializes all states as loading", () => {
      const state = createInitialState({
        title: "Test",
        prompt: "Test",
        models: [
          { providerId: "openai", modelId: "gpt-4", displayName: "GPT-4" },
          { providerId: "claude", modelId: "claude-3", displayName: "Claude 3" },
        ],
      });

      for (const [, providerState] of state.states) {
        assert.strictEqual(providerState.status, "loading");
      }
    });

    it("initializes with first provider active", () => {
      const state = createInitialState({
        title: "Test",
        prompt: "Test",
        models: [
          { providerId: "openai", modelId: "gpt-4", displayName: "GPT-4" },
          { providerId: "claude", modelId: "claude-3", displayName: "Claude 3" },
        ],
      });

      assert.strictEqual(state.activeProviderIdx, 0);
    });

    it("initializes focusedPanel as null", () => {
      const state = createInitialState({
        title: "Test",
        prompt: "Test",
        models: [
          { providerId: "openai", modelId: "gpt-4", displayName: "GPT-4" },
        ],
      });

      assert.strictEqual(state.focusedPanel, null);
    });

    it("initializes showHelp as false", () => {
      const state = createInitialState({
        title: "Test",
        prompt: "Test",
        models: [
          { providerId: "openai", modelId: "gpt-4", displayName: "GPT-4" },
        ],
      });

      assert.strictEqual(state.showHelp, false);
    });
  });

  describe("updateFromResult", () => {
    it("updates state to done on success", () => {
      const state = createInitialState({
        title: "Test",
        prompt: "Test",
        models: [
          { providerId: "openai", modelId: "gpt-4", displayName: "GPT-4" },
        ],
      });

      updateFromResult(state, { providerId: "openai", modelId: "gpt-4" }, {
        kind: "success",
        provider: "openai",
        model: "gpt-4",
        text: "Hello world",
        elapsed_ms: 1000,
        tokens: { input_tokens: 10, output_tokens: 20 },
      });

      const tabId = createTabId("openai", "gpt-4");
      const tabState = state.states.get(tabId);
      assert.strictEqual(tabState.status, "done");
      assert.strictEqual(tabState.text, "Hello world");
      assert.strictEqual(tabState.elapsed_ms, 1000);
    });

    it("updates state to error on failure", () => {
      const state = createInitialState({
        title: "Test",
        prompt: "Test",
        models: [
          { providerId: "openai", modelId: "gpt-4", displayName: "GPT-4" },
        ],
      });

      updateFromResult(state, { providerId: "openai", modelId: "gpt-4" }, {
        kind: "failure",
        failureType: "api_error",
        provider: "openai",
        model: "gpt-4",
        message: "Rate limit exceeded",
        elapsed_ms: 500,
        status: 429,
      });

      const tabId = createTabId("openai", "gpt-4");
      const tabState = state.states.get(tabId);
      assert.strictEqual(tabState.status, "error");
      assert.ok(tabState.error.includes("Rate limit"));
    });

    it("updates state to skipped for api_key_missing", () => {
      const state = createInitialState({
        title: "Test",
        prompt: "Test",
        models: [
          { providerId: "openai", modelId: "gpt-4", displayName: "GPT-4" },
        ],
      });

      updateFromResult(state, { providerId: "openai", modelId: "gpt-4" }, {
        kind: "failure",
        failureType: "api_key_missing",
        provider: "openai",
        model: "gpt-4",
        message: "API key not configured",
        elapsed_ms: 0,
        status: 0,
      });

      const tabId = createTabId("openai", "gpt-4");
      const tabState = state.states.get(tabId);
      assert.strictEqual(tabState.status, "skipped");
    });

    it("updates state to skipped for disabled provider", () => {
      const state = createInitialState({
        title: "Test",
        prompt: "Test",
        models: [
          { providerId: "openai", modelId: "gpt-4", displayName: "GPT-4" },
        ],
      });

      updateFromResult(state, { providerId: "openai", modelId: "gpt-4" }, {
        kind: "failure",
        failureType: "disabled",
        provider: "openai",
        model: "gpt-4",
        message: "Provider disabled",
        elapsed_ms: 0,
        status: 0,
      });

      const tabId = createTabId("openai", "gpt-4");
      const tabState = state.states.get(tabId);
      assert.strictEqual(tabState.status, "skipped");
    });

    it("preserves token information", () => {
      const state = createInitialState({
        title: "Test",
        prompt: "Test",
        models: [
          { providerId: "openai", modelId: "gpt-4", displayName: "GPT-4" },
        ],
      });

      updateFromResult(state, { providerId: "openai", modelId: "gpt-4" }, {
        kind: "success",
        provider: "openai",
        model: "gpt-4",
        text: "Response",
        elapsed_ms: 1000,
        tokens: { input_tokens: 50, output_tokens: 100 },
      });

      const tabId = createTabId("openai", "gpt-4");
      const tabState = state.states.get(tabId);
      assert.deepStrictEqual(tabState.tokens, { input_tokens: 50, output_tokens: 100 });
    });
  });

  describe("updateFromError", () => {
    it("updates state from Error object", () => {
      const state = createInitialState({
        title: "Test",
        prompt: "Test",
        models: [
          { providerId: "openai", modelId: "gpt-4", displayName: "GPT-4" },
        ],
      });

      updateFromError(state, { providerId: "openai", modelId: "gpt-4" }, new Error("Network failed"));

      const tabId = createTabId("openai", "gpt-4");
      const tabState = state.states.get(tabId);
      assert.strictEqual(tabState.status, "error");
      assert.strictEqual(tabState.error, "Network failed");
    });

    it("updates state from string error", () => {
      const state = createInitialState({
        title: "Test",
        prompt: "Test",
        models: [
          { providerId: "openai", modelId: "gpt-4", displayName: "GPT-4" },
        ],
      });

      updateFromError(state, { providerId: "openai", modelId: "gpt-4" }, "Connection timeout");

      const tabId = createTabId("openai", "gpt-4");
      const tabState = state.states.get(tabId);
      assert.strictEqual(tabState.status, "error");
      assert.strictEqual(tabState.error, "Connection timeout");
    });

    it("handles unknown error types", () => {
      const state = createInitialState({
        title: "Test",
        prompt: "Test",
        models: [
          { providerId: "openai", modelId: "gpt-4", displayName: "GPT-4" },
        ],
      });

      updateFromError(state, { providerId: "openai", modelId: "gpt-4" }, { code: "ERR_UNKNOWN" });

      const tabId = createTabId("openai", "gpt-4");
      const tabState = state.states.get(tabId);
      assert.strictEqual(tabState.status, "error");
      assert.ok(tabState.error.length > 0);
    });
  });

  describe("isAllSettled", () => {
    it("returns false when any loading", () => {
      const state = createInitialState({
        title: "Test",
        prompt: "Test",
        models: [
          { providerId: "openai", modelId: "gpt-4", displayName: "GPT-4" },
          { providerId: "claude", modelId: "claude-3", displayName: "Claude 3" },
        ],
      });

      updateFromResult(state, { providerId: "openai", modelId: "gpt-4" }, {
        kind: "success",
        provider: "openai",
        model: "gpt-4",
        text: "Done",
        elapsed_ms: 100,
      });

      // claude-3 is still loading
      assert.strictEqual(isAllSettled(state), false);
    });

    it("returns true when all done", () => {
      const state = createInitialState({
        title: "Test",
        prompt: "Test",
        models: [
          { providerId: "openai", modelId: "gpt-4", displayName: "GPT-4" },
        ],
      });

      updateFromResult(state, { providerId: "openai", modelId: "gpt-4" }, {
        kind: "success",
        provider: "openai",
        model: "gpt-4",
        text: "Done",
        elapsed_ms: 100,
      });

      assert.strictEqual(isAllSettled(state), true);
    });

    it("returns true when all error", () => {
      const state = createInitialState({
        title: "Test",
        prompt: "Test",
        models: [
          { providerId: "openai", modelId: "gpt-4", displayName: "GPT-4" },
        ],
      });

      updateFromError(state, { providerId: "openai", modelId: "gpt-4" }, new Error("Failed"));

      assert.strictEqual(isAllSettled(state), true);
    });

    it("returns true when mixed done/error/skipped", () => {
      const state = createInitialState({
        title: "Test",
        prompt: "Test",
        models: [
          { providerId: "openai", modelId: "gpt-4", displayName: "GPT-4" },
          { providerId: "claude", modelId: "claude-3", displayName: "Claude 3" },
          { providerId: "gemini", modelId: "gemini-2", displayName: "Gemini 2" },
        ],
      });

      updateFromResult(state, { providerId: "openai", modelId: "gpt-4" }, {
        kind: "success",
        provider: "openai",
        model: "gpt-4",
        text: "Done",
        elapsed_ms: 100,
      });

      updateFromError(state, { providerId: "claude", modelId: "claude-3" }, new Error("Failed"));

      updateFromResult(state, { providerId: "gemini", modelId: "gemini-2" }, {
        kind: "failure",
        failureType: "api_key_missing",
        provider: "gemini",
        model: "gemini-2",
        message: "No key",
        elapsed_ms: 0,
        status: 0,
      });

      assert.strictEqual(isAllSettled(state), true);
    });
  });

  describe("getCurrentProviderTabs", () => {
    it("returns tabs for active provider", () => {
      const state = createInitialState({
        title: "Test",
        prompt: "Test",
        models: [
          { providerId: "openai", modelId: "gpt-4", displayName: "GPT-4" },
          { providerId: "openai", modelId: "gpt-3.5", displayName: "GPT-3.5" },
          { providerId: "claude", modelId: "claude-3", displayName: "Claude 3" },
        ],
      });

      state.activeProviderIdx = 0;
      const tabs = getCurrentProviderTabs(state);
      assert.strictEqual(tabs.length, 2);
      assert.ok(tabs.some((t) => t.label === "GPT-4"));
      assert.ok(tabs.some((t) => t.label === "GPT-3.5"));
    });

    it("returns tabs for different provider when switched", () => {
      const state = createInitialState({
        title: "Test",
        prompt: "Test",
        models: [
          { providerId: "openai", modelId: "gpt-4", displayName: "GPT-4" },
          { providerId: "claude", modelId: "claude-3", displayName: "Claude 3" },
        ],
      });

      state.activeProviderIdx = 1;
      const tabs = getCurrentProviderTabs(state);
      assert.strictEqual(tabs.length, 1);
      assert.strictEqual(tabs[0].label, "Claude 3");
    });

    it("returns empty array for invalid index", () => {
      const state = createInitialState({
        title: "Test",
        prompt: "Test",
        models: [
          { providerId: "openai", modelId: "gpt-4", displayName: "GPT-4" },
        ],
      });

      state.activeProviderIdx = 99;
      const tabs = getCurrentProviderTabs(state);
      assert.deepStrictEqual(tabs, []);
    });
  });

  describe("notification handling", () => {
    it("initializes without notification", () => {
      const state = createInitialState({
        title: "Test",
        prompt: "Test",
        models: [
          { providerId: "openai", modelId: "gpt-4", displayName: "GPT-4" },
        ],
      });

      assert.strictEqual(state.notification, null);
    });

    it("can store notification", () => {
      const state = createInitialState({
        title: "Test",
        prompt: "Test",
        models: [
          { providerId: "openai", modelId: "gpt-4", displayName: "GPT-4" },
        ],
      });

      state.notification = { msg: "Copied!", until: Date.now() + 2000 };
      assert.strictEqual(state.notification.msg, "Copied!");
    });
  });

  describe("settled callback", () => {
    it("initializes settledCallbackFired as false", () => {
      const state = createInitialState({
        title: "Test",
        prompt: "Test",
        models: [
          { providerId: "openai", modelId: "gpt-4", displayName: "GPT-4" },
        ],
      });

      assert.strictEqual(state.settledCallbackFired, false);
    });

    it("can mark callback as fired", () => {
      const state = createInitialState({
        title: "Test",
        prompt: "Test",
        models: [
          { providerId: "openai", modelId: "gpt-4", displayName: "GPT-4" },
        ],
      });

      state.settledCallbackFired = true;
      assert.strictEqual(state.settledCallbackFired, true);
    });
  });
});

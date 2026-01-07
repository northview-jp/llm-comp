import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  createInitialState,
  getCurrentProviderTabs,
  isAllSettled,
  updateFromResult,
  updateFromError,
  createTabId,
} from "../../dist/ui/tabbed/state.js";

describe("tabbed/state", () => {
  describe("createTabId", () => {
    it("should create tab ID from provider and model", () => {
      assert.equal(createTabId("openai", "gpt-4"), "openai:gpt-4");
      assert.equal(createTabId("claude", "claude-3-opus"), "claude:claude-3-opus");
    });
  });

  describe("createInitialState", () => {
    it("should create state for a single model", () => {
      const state = createInitialState({
        title: "Test",
        prompt: "Hello",
        models: [
          { providerId: "openai", modelId: "gpt-4", displayName: "GPT-4" },
        ],
      });

      assert.equal(state.title, "Test");
      assert.equal(state.prompt, "Hello");
      assert.equal(state.providerGroups.length, 1);
      assert.equal(state.providerGroups[0].providerId, "openai");
      assert.equal(state.providerGroups[0].tabs.length, 1);
      assert.equal(state.providerGroups[0].tabs[0].modelId, "gpt-4");
      assert.equal(state.activeProviderIdx, 0);
      assert.equal(state.focusedPanel, null);
      assert.equal(state.showHelp, false);
    });

    it("should create state for multiple models from same provider", () => {
      const state = createInitialState({
        title: "Test",
        prompt: "Hello",
        models: [
          { providerId: "openai", modelId: "gpt-4", displayName: "GPT-4" },
          { providerId: "openai", modelId: "gpt-4o", displayName: "GPT-4o" },
        ],
      });

      assert.equal(state.providerGroups.length, 1);
      assert.equal(state.providerGroups[0].tabs.length, 2);
    });

    it("should create state for multiple providers", () => {
      const state = createInitialState({
        title: "Test",
        prompt: "Hello",
        models: [
          { providerId: "openai", modelId: "gpt-4", displayName: "GPT-4" },
          { providerId: "claude", modelId: "claude-3-opus", displayName: "Opus" },
        ],
      });

      assert.equal(state.providerGroups.length, 2);
      assert.equal(state.providerGroups[0].providerId, "openai");
      assert.equal(state.providerGroups[1].providerId, "claude");
    });

    it("should initialize all states as loading", () => {
      const state = createInitialState({
        title: "Test",
        prompt: "Hello",
        models: [
          { providerId: "openai", modelId: "gpt-4", displayName: "GPT-4" },
          { providerId: "claude", modelId: "claude-3-opus", displayName: "Opus" },
        ],
      });

      for (const [, s] of state.states) {
        assert.equal(s.status, "loading");
      }
    });

    it("should initialize all scroll positions to 0", () => {
      const state = createInitialState({
        title: "Test",
        prompt: "Hello",
        models: [
          { providerId: "openai", modelId: "gpt-4", displayName: "GPT-4" },
        ],
      });

      for (const [, scroll] of state.scroll) {
        assert.equal(scroll, 0);
      }
    });
  });

  describe("getCurrentProviderTabs", () => {
    it("should return tabs for active provider", () => {
      const state = createInitialState({
        title: "Test",
        prompt: "Hello",
        models: [
          { providerId: "openai", modelId: "gpt-4", displayName: "GPT-4" },
          { providerId: "claude", modelId: "claude-3-opus", displayName: "Opus" },
        ],
      });

      state.activeProviderIdx = 0;
      const tabs0 = getCurrentProviderTabs(state);
      assert.equal(tabs0.length, 1);
      assert.equal(tabs0[0].providerId, "openai");

      state.activeProviderIdx = 1;
      const tabs1 = getCurrentProviderTabs(state);
      assert.equal(tabs1.length, 1);
      assert.equal(tabs1[0].providerId, "claude");
    });

    it("should return empty array for invalid index", () => {
      const state = createInitialState({
        title: "Test",
        prompt: "Hello",
        models: [
          { providerId: "openai", modelId: "gpt-4", displayName: "GPT-4" },
        ],
      });

      state.activeProviderIdx = 99;
      const tabs = getCurrentProviderTabs(state);
      assert.deepEqual(tabs, []);
    });
  });

  describe("isAllSettled", () => {
    it("should return false when any state is loading", () => {
      const state = createInitialState({
        title: "Test",
        prompt: "Hello",
        models: [
          { providerId: "openai", modelId: "gpt-4", displayName: "GPT-4" },
        ],
      });

      assert.equal(isAllSettled(state), false);
    });

    it("should return true when all states are done", () => {
      const state = createInitialState({
        title: "Test",
        prompt: "Hello",
        models: [
          { providerId: "openai", modelId: "gpt-4", displayName: "GPT-4" },
        ],
      });

      state.states.set("openai:gpt-4", {
        status: "done",
        label: "GPT-4",
        text: "response",
        elapsed_ms: 100,
      });

      assert.equal(isAllSettled(state), true);
    });

    it("should return true when all states are error", () => {
      const state = createInitialState({
        title: "Test",
        prompt: "Hello",
        models: [
          { providerId: "openai", modelId: "gpt-4", displayName: "GPT-4" },
        ],
      });

      state.states.set("openai:gpt-4", {
        status: "error",
        label: "GPT-4",
        error: "failed",
        elapsed_ms: 100,
      });

      assert.equal(isAllSettled(state), true);
    });

    it("should return true when all states are skipped", () => {
      const state = createInitialState({
        title: "Test",
        prompt: "Hello",
        models: [
          { providerId: "openai", modelId: "gpt-4", displayName: "GPT-4" },
        ],
      });

      state.states.set("openai:gpt-4", {
        status: "skipped",
        label: "GPT-4",
        error: "disabled",
        elapsed_ms: 0,
      });

      assert.equal(isAllSettled(state), true);
    });

    it("should return false with mixed settled and loading states", () => {
      const state = createInitialState({
        title: "Test",
        prompt: "Hello",
        models: [
          { providerId: "openai", modelId: "gpt-4", displayName: "GPT-4" },
          { providerId: "claude", modelId: "claude-3-opus", displayName: "Opus" },
        ],
      });

      state.states.set("openai:gpt-4", {
        status: "done",
        label: "GPT-4",
        text: "response",
        elapsed_ms: 100,
      });

      assert.equal(isAllSettled(state), false);
    });
  });

  describe("updateFromResult", () => {
    it("should update state on success response", () => {
      const state = createInitialState({
        title: "Test",
        prompt: "Hello",
        models: [
          { providerId: "openai", modelId: "gpt-4", displayName: "GPT-4" },
        ],
      });

      updateFromResult(
        state,
        { providerId: "openai", modelId: "gpt-4", displayName: "GPT-4" },
        {
          kind: "success",
          provider: "openai",
          model: "gpt-4",
          text: "Hello!",
          elapsed_ms: 150,
          tokens: { input_tokens: 10, output_tokens: 5 },
        }
      );

      const s = state.states.get("openai:gpt-4");
      assert.equal(s.status, "done");
      assert.equal(s.text, "Hello!");
      assert.equal(s.elapsed_ms, 150);
      assert.deepEqual(s.tokens, { input_tokens: 10, output_tokens: 5 });
    });

    it("should update state on failure response", () => {
      const state = createInitialState({
        title: "Test",
        prompt: "Hello",
        models: [
          { providerId: "openai", modelId: "gpt-4", displayName: "GPT-4" },
        ],
      });

      updateFromResult(
        state,
        { providerId: "openai", modelId: "gpt-4", displayName: "GPT-4" },
        {
          kind: "failure",
          failureType: "api_error",
          provider: "openai",
          model: "gpt-4",
          message: "Rate limited",
          elapsed_ms: 50,
        }
      );

      const s = state.states.get("openai:gpt-4");
      assert.equal(s.status, "error");
      assert.equal(s.error, "Rate limited");
    });

    it("should set skipped status for api_key_missing", () => {
      const state = createInitialState({
        title: "Test",
        prompt: "Hello",
        models: [
          { providerId: "openai", modelId: "gpt-4", displayName: "GPT-4" },
        ],
      });

      updateFromResult(
        state,
        { providerId: "openai", modelId: "gpt-4", displayName: "GPT-4" },
        {
          kind: "failure",
          failureType: "api_key_missing",
          provider: "openai",
          message: "OPENAI_API_KEY not set",
          elapsed_ms: 0,
        }
      );

      const s = state.states.get("openai:gpt-4");
      assert.equal(s.status, "skipped");
    });

    it("should set skipped status for disabled", () => {
      const state = createInitialState({
        title: "Test",
        prompt: "Hello",
        models: [
          { providerId: "openai", modelId: "gpt-4", displayName: "GPT-4" },
        ],
      });

      updateFromResult(
        state,
        { providerId: "openai", modelId: "gpt-4", displayName: "GPT-4" },
        {
          kind: "failure",
          failureType: "disabled",
          provider: "openai",
          message: "disabled",
          elapsed_ms: 0,
        }
      );

      const s = state.states.get("openai:gpt-4");
      assert.equal(s.status, "skipped");
    });

    it("should not update state for unknown tab", () => {
      const state = createInitialState({
        title: "Test",
        prompt: "Hello",
        models: [
          { providerId: "openai", modelId: "gpt-4", displayName: "GPT-4" },
        ],
      });

      updateFromResult(
        state,
        { providerId: "claude", modelId: "opus", displayName: "Opus" },
        {
          kind: "success",
          provider: "claude",
          model: "opus",
          text: "Hello",
          elapsed_ms: 100,
        }
      );

      assert.equal(state.states.has("claude:opus"), false);
    });
  });

  describe("updateFromError", () => {
    it("should update state from Error object", () => {
      const state = createInitialState({
        title: "Test",
        prompt: "Hello",
        models: [
          { providerId: "openai", modelId: "gpt-4", displayName: "GPT-4" },
        ],
      });

      updateFromError(
        state,
        { providerId: "openai", modelId: "gpt-4", displayName: "GPT-4" },
        new Error("Network error")
      );

      const s = state.states.get("openai:gpt-4");
      assert.equal(s.status, "error");
      assert.equal(s.error, "Network error");
      assert.equal(s.elapsed_ms, 0);
    });

    it("should update state from string error", () => {
      const state = createInitialState({
        title: "Test",
        prompt: "Hello",
        models: [
          { providerId: "openai", modelId: "gpt-4", displayName: "GPT-4" },
        ],
      });

      updateFromError(
        state,
        { providerId: "openai", modelId: "gpt-4", displayName: "GPT-4" },
        "Something went wrong"
      );

      const s = state.states.get("openai:gpt-4");
      assert.equal(s.status, "error");
      assert.equal(s.error, "Something went wrong");
    });

    it("should not update state for unknown tab", () => {
      const state = createInitialState({
        title: "Test",
        prompt: "Hello",
        models: [
          { providerId: "openai", modelId: "gpt-4", displayName: "GPT-4" },
        ],
      });

      updateFromError(
        state,
        { providerId: "claude", modelId: "opus", displayName: "Opus" },
        new Error("fail")
      );

      assert.equal(state.states.has("claude:opus"), false);
    });
  });
});

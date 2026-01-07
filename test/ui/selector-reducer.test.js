import { describe, it } from "node:test";
import assert from "node:assert";
import { reduceSelectionState } from "../../dist/ui/selector/reducer.js";

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
          { id: "gpt-3.5", displayName: "GPT-3.5", selected: false, tier: "standard" },
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

describe("selector/reducer", () => {
  describe("MOVE_DOWN", () => {
    it("moves from provider header into models when expanded", () => {
      const state = createTestState({ cursorProvider: 0, cursorModel: -1 });
      const result = reduceSelectionState(state, { type: "MOVE_DOWN" });

      assert.strictEqual(result.state.cursorProvider, 0);
      assert.strictEqual(result.state.cursorModel, 0);
    });

    it("moves between models within a provider", () => {
      const state = createTestState({ cursorProvider: 0, cursorModel: 0 });
      const result = reduceSelectionState(state, { type: "MOVE_DOWN" });

      assert.strictEqual(result.state.cursorProvider, 0);
      assert.strictEqual(result.state.cursorModel, 1);
    });

    it("moves to next provider when at last model", () => {
      const state = createTestState({ cursorProvider: 0, cursorModel: 1 });
      const result = reduceSelectionState(state, { type: "MOVE_DOWN" });

      assert.strictEqual(result.state.cursorProvider, 1);
      assert.strictEqual(result.state.cursorModel, -1);
    });

    it("does not move past last provider", () => {
      const state = createTestState({ cursorProvider: 1, cursorModel: -1 });
      state.expanded.delete("claude");
      const result = reduceSelectionState(state, { type: "MOVE_DOWN" });

      assert.strictEqual(result.state.cursorProvider, 1);
      assert.strictEqual(result.state.cursorModel, -1);
    });

    it("skips models when provider is collapsed", () => {
      const state = createTestState({
        cursorProvider: 0,
        cursorModel: -1,
        expanded: new Set(),
      });
      const result = reduceSelectionState(state, { type: "MOVE_DOWN" });

      assert.strictEqual(result.state.cursorProvider, 1);
      assert.strictEqual(result.state.cursorModel, -1);
    });
  });

  describe("MOVE_UP", () => {
    it("moves from model to model within provider", () => {
      const state = createTestState({ cursorProvider: 0, cursorModel: 1 });
      const result = reduceSelectionState(state, { type: "MOVE_UP" });

      assert.strictEqual(result.state.cursorProvider, 0);
      assert.strictEqual(result.state.cursorModel, 0);
    });

    it("moves from first model to provider header", () => {
      const state = createTestState({ cursorProvider: 0, cursorModel: 0 });
      const result = reduceSelectionState(state, { type: "MOVE_UP" });

      assert.strictEqual(result.state.cursorProvider, 0);
      assert.strictEqual(result.state.cursorModel, -1);
    });

    it("moves to previous provider last model when provider is expanded", () => {
      const state = createTestState({ cursorProvider: 1, cursorModel: -1 });
      const result = reduceSelectionState(state, { type: "MOVE_UP" });

      assert.strictEqual(result.state.cursorProvider, 0);
      assert.strictEqual(result.state.cursorModel, 1);
    });

    it("moves to previous provider header when collapsed", () => {
      const state = createTestState({
        cursorProvider: 1,
        cursorModel: -1,
        expanded: new Set(),
      });
      const result = reduceSelectionState(state, { type: "MOVE_UP" });

      assert.strictEqual(result.state.cursorProvider, 0);
      assert.strictEqual(result.state.cursorModel, -1);
    });

    it("does not move past first provider", () => {
      const state = createTestState({ cursorProvider: 0, cursorModel: -1 });
      const result = reduceSelectionState(state, { type: "MOVE_UP" });

      assert.strictEqual(result.state.cursorProvider, 0);
      assert.strictEqual(result.state.cursorModel, -1);
    });
  });

  describe("TOGGLE", () => {
    it("toggles provider expansion when on provider header", () => {
      const state = createTestState({ cursorProvider: 0, cursorModel: -1 });
      const result = reduceSelectionState(state, { type: "TOGGLE" });

      assert.strictEqual(result.state.expanded.has("openai"), false);
      assert.strictEqual(result.error, undefined);
    });

    it("expands collapsed provider", () => {
      const state = createTestState({
        cursorProvider: 1,
        cursorModel: -1,
        expanded: new Set(),
      });
      const result = reduceSelectionState(state, { type: "TOGGLE" });

      assert.strictEqual(result.state.expanded.has("claude"), true);
    });

    it("selects a model when on model row", () => {
      const state = createTestState({
        cursorProvider: 0,
        cursorModel: 0,
      });
      const result = reduceSelectionState(state, { type: "TOGGLE" });

      assert.strictEqual(result.state.providers[0].models[0].selected, true);
      assert.strictEqual(result.error, undefined);
    });

    it("deselects a selected model", () => {
      const state = createTestState({
        cursorProvider: 0,
        cursorModel: 0,
      });
      state.providers[0].models[0].selected = true;
      const result = reduceSelectionState(state, { type: "TOGGLE" });

      assert.strictEqual(result.state.providers[0].models[0].selected, false);
    });

    it("returns error when selecting 5th model from same provider", () => {
      const state = createTestState();
      state.providers[0].models = [
        { id: "m1", displayName: "M1", selected: true, tier: "standard" },
        { id: "m2", displayName: "M2", selected: true, tier: "standard" },
        { id: "m3", displayName: "M3", selected: true, tier: "standard" },
        { id: "m4", displayName: "M4", selected: true, tier: "standard" },
        { id: "m5", displayName: "M5", selected: false, tier: "standard" },
      ];
      state.cursorModel = 4;

      const result = reduceSelectionState(state, { type: "TOGGLE" });

      assert.strictEqual(result.error, "Max 4 models per provider");
      assert.strictEqual(result.state.errorMessage, "Max 4 models per provider");
      assert.strictEqual(result.state.providers[0].models[4].selected, false);
    });

    it("clears error message when successfully toggling", () => {
      const state = createTestState({
        cursorProvider: 0,
        cursorModel: 0,
        errorMessage: "Previous error",
      });
      const result = reduceSelectionState(state, { type: "TOGGLE" });

      assert.strictEqual(result.state.errorMessage, null);
    });
  });

  describe("CLEAR_ERROR", () => {
    it("clears error message", () => {
      const state = createTestState({ errorMessage: "Some error" });
      const result = reduceSelectionState(state, { type: "CLEAR_ERROR" });

      assert.strictEqual(result.state.errorMessage, null);
    });

    it("does nothing when no error", () => {
      const state = createTestState();
      const result = reduceSelectionState(state, { type: "CLEAR_ERROR" });

      assert.strictEqual(result.state.errorMessage, null);
    });
  });

  describe("unknown action", () => {
    it("returns state unchanged", () => {
      const state = createTestState();
      const result = reduceSelectionState(state, { type: "UNKNOWN" });

      assert.deepStrictEqual(result.state, state);
    });
  });
});

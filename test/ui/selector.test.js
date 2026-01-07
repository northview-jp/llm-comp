import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";

import { createTestSelector, simulateKeyPress } from "./test-utils.js";

describe("ModelSelector", () => {
  describe("4-model selection limit per provider", () => {
    it("should allow selecting up to 4 models from the same provider", () => {
      const selector = createTestSelector({
        providers: [
          {
            providerId: "openai",
            displayName: "OpenAI",
            models: [
              { id: "model-1", displayName: "Model 1", tier: "standard" },
              { id: "model-2", displayName: "Model 2", tier: "standard" },
              { id: "model-3", displayName: "Model 3", tier: "standard" },
              { id: "model-4", displayName: "Model 4", tier: "standard" },
            ],
          },
        ],
      });

      // Select all 4 models
      for (let i = 0; i < 4; i++) {
        simulateKeyPress(selector, "down"); // Move to model
        simulateKeyPress(selector, "space"); // Select
      }

      const state = selector.getState();
      const selectedCount = state.providers[0].models.filter(
        (m) => m.selected
      ).length;
      assert.strictEqual(selectedCount, 4, "Should select all 4 models");
      assert.strictEqual(
        state.errorMessage,
        null,
        "Should not have error message"
      );
    });

    it("should prevent selecting 5th model and show error message", () => {
      const selector = createTestSelector({
        providers: [
          {
            providerId: "openai",
            displayName: "OpenAI",
            models: [
              { id: "model-1", displayName: "Model 1", tier: "standard" },
              { id: "model-2", displayName: "Model 2", tier: "standard" },
              { id: "model-3", displayName: "Model 3", tier: "standard" },
              { id: "model-4", displayName: "Model 4", tier: "standard" },
              { id: "model-5", displayName: "Model 5", tier: "standard" },
            ],
          },
        ],
      });

      // Select first 4 models
      for (let i = 0; i < 4; i++) {
        simulateKeyPress(selector, "down");
        simulateKeyPress(selector, "space");
      }

      // Try to select 5th model
      simulateKeyPress(selector, "down");
      simulateKeyPress(selector, "space");

      const state = selector.getState();
      const selectedCount = state.providers[0].models.filter(
        (m) => m.selected
      ).length;

      assert.strictEqual(selectedCount, 4, "Should still have only 4 selected");
      assert.strictEqual(
        state.providers[0].models[4].selected,
        false,
        "5th model should not be selected"
      );
      assert.strictEqual(
        state.errorMessage,
        "Max 4 models per provider",
        "Should show error message"
      );
    });

    it("should clear error message when deselecting a model", () => {
      const selector = createTestSelector({
        providers: [
          {
            providerId: "openai",
            displayName: "OpenAI",
            models: [
              { id: "model-1", displayName: "Model 1", tier: "standard" },
              { id: "model-2", displayName: "Model 2", tier: "standard" },
              { id: "model-3", displayName: "Model 3", tier: "standard" },
              { id: "model-4", displayName: "Model 4", tier: "standard" },
              { id: "model-5", displayName: "Model 5", tier: "standard" },
            ],
          },
        ],
      });

      // Select first 4 models
      for (let i = 0; i < 4; i++) {
        simulateKeyPress(selector, "down");
        simulateKeyPress(selector, "space");
      }

      // Try to select 5th (should fail and show error)
      simulateKeyPress(selector, "down");
      simulateKeyPress(selector, "space");

      assert.strictEqual(
        selector.getState().errorMessage,
        "Max 4 models per provider"
      );

      // Go back and deselect one
      simulateKeyPress(selector, "up");
      simulateKeyPress(selector, "space"); // Deselect model-4

      const state = selector.getState();
      assert.strictEqual(
        state.errorMessage,
        null,
        "Error message should be cleared"
      );
    });

    it("should allow selecting 4 models from different providers", () => {
      const selector = createTestSelector({
        providers: [
          {
            providerId: "openai",
            displayName: "OpenAI",
            models: [
              { id: "model-1", displayName: "Model 1", tier: "standard" },
              { id: "model-2", displayName: "Model 2", tier: "standard" },
              { id: "model-3", displayName: "Model 3", tier: "standard" },
              { id: "model-4", displayName: "Model 4", tier: "standard" },
            ],
          },
          {
            providerId: "anthropic",
            displayName: "Claude",
            models: [
              { id: "claude-1", displayName: "Claude 1", tier: "standard" },
              { id: "claude-2", displayName: "Claude 2", tier: "standard" },
              { id: "claude-3", displayName: "Claude 3", tier: "standard" },
              { id: "claude-4", displayName: "Claude 4", tier: "standard" },
            ],
          },
        ],
      });

      // Select 4 from OpenAI
      for (let i = 0; i < 4; i++) {
        simulateKeyPress(selector, "down");
        simulateKeyPress(selector, "space");
      }

      // Move to Claude provider and select 4
      simulateKeyPress(selector, "down"); // Move to Claude header
      for (let i = 0; i < 4; i++) {
        simulateKeyPress(selector, "down");
        simulateKeyPress(selector, "space");
      }

      const state = selector.getState();
      const openaiSelected = state.providers[0].models.filter(
        (m) => m.selected
      ).length;
      const claudeSelected = state.providers[1].models.filter(
        (m) => m.selected
      ).length;

      assert.strictEqual(openaiSelected, 4, "Should have 4 OpenAI selected");
      assert.strictEqual(claudeSelected, 4, "Should have 4 Claude selected");
      assert.strictEqual(
        state.errorMessage,
        null,
        "Should not have error message"
      );
    });
  });
});

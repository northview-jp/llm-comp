import { describe, it } from "node:test";
import assert from "node:assert";

import { createTestSelector, simulateKeyPress } from "./test-utils.js";

describe("ModelSelector (extended)", () => {
  describe("initialization", () => {
    it("initializes with empty providers list", () => {
      const selector = createTestSelector({ providers: [] });
      const state = selector.getState();
      assert.deepStrictEqual(state.providers, []);
      assert.strictEqual(state.cursorProvider, 0);
      assert.strictEqual(state.cursorModel, -1);
    });

    it("initializes cursor on first model when available", () => {
      const selector = createTestSelector({
        providers: [
          {
            providerId: "openai",
            displayName: "OpenAI",
            models: [{ id: "gpt-4", displayName: "GPT-4", tier: "flagship" }],
          },
        ],
      });
      const state = selector.getState();
      assert.strictEqual(state.cursorProvider, 0);
      assert.strictEqual(state.cursorModel, -1); // Starts on provider header
    });

    it("expands all providers by default", () => {
      const selector = createTestSelector({
        providers: [
          {
            providerId: "openai",
            displayName: "OpenAI",
            models: [{ id: "gpt-4", displayName: "GPT-4", tier: "flagship" }],
          },
          {
            providerId: "claude",
            displayName: "Claude",
            models: [{ id: "claude-3", displayName: "Claude 3", tier: "flagship" }],
          },
        ],
      });
      const state = selector.getState();
      assert.ok(state.expanded.has("openai"));
      assert.ok(state.expanded.has("claude"));
    });

    it("initializes models with correct tier", () => {
      const selector = createTestSelector({
        providers: [
          {
            providerId: "openai",
            displayName: "OpenAI",
            models: [
              { id: "gpt-4", displayName: "GPT-4", tier: "flagship" },
              { id: "gpt-3.5", displayName: "GPT-3.5", tier: "standard" },
              { id: "gpt-4o-mini", displayName: "GPT-4o mini", tier: "fast" },
            ],
          },
        ],
      });
      const state = selector.getState();
      assert.strictEqual(state.providers[0].models[0].tier, "flagship");
      assert.strictEqual(state.providers[0].models[1].tier, "standard");
      assert.strictEqual(state.providers[0].models[2].tier, "fast");
    });

    it("defaults tier to standard when not specified", () => {
      const selector = createTestSelector({
        providers: [
          {
            providerId: "openai",
            displayName: "OpenAI",
            models: [{ id: "gpt-4", displayName: "GPT-4" }],
          },
        ],
      });
      const state = selector.getState();
      assert.strictEqual(state.providers[0].models[0].tier, "standard");
    });
  });

  describe("getSelectedModels", () => {
    it("returns empty array when no models selected", () => {
      const selector = createTestSelector({
        providers: [
          {
            providerId: "openai",
            displayName: "OpenAI",
            models: [{ id: "gpt-4", displayName: "GPT-4", tier: "flagship" }],
          },
        ],
      });
      const state = selector.getState();
      const selected = state.providers.flatMap((p) =>
        p.models.filter((m) => m.selected).map((m) => ({
          providerId: p.providerId,
          modelId: m.id,
        }))
      );
      assert.deepStrictEqual(selected, []);
    });

    it("returns selected models with correct structure", () => {
      const selector = createTestSelector({
        providers: [
          {
            providerId: "openai",
            displayName: "OpenAI",
            models: [{ id: "gpt-4", displayName: "GPT-4", tier: "flagship" }],
          },
        ],
      });

      // Move to model and select
      simulateKeyPress(selector, "down");
      simulateKeyPress(selector, "space");

      const state = selector.getState();
      const selected = state.providers.flatMap((p) =>
        p.models.filter((m) => m.selected).map((m) => ({
          providerId: p.providerId,
          modelId: m.id,
        }))
      );

      assert.strictEqual(selected.length, 1);
      assert.strictEqual(selected[0].providerId, "openai");
      assert.strictEqual(selected[0].modelId, "gpt-4");
    });

    it("returns models from multiple providers", () => {
      const selector = createTestSelector({
        providers: [
          {
            providerId: "openai",
            displayName: "OpenAI",
            models: [{ id: "gpt-4", displayName: "GPT-4", tier: "flagship" }],
          },
          {
            providerId: "claude",
            displayName: "Claude",
            models: [{ id: "claude-3", displayName: "Claude 3", tier: "flagship" }],
          },
        ],
      });

      // Select from OpenAI
      simulateKeyPress(selector, "down");
      simulateKeyPress(selector, "space");

      // Move to Claude and select
      simulateKeyPress(selector, "down"); // Claude header
      simulateKeyPress(selector, "down"); // Claude model
      simulateKeyPress(selector, "space");

      const state = selector.getState();
      const selected = state.providers.flatMap((p) =>
        p.models.filter((m) => m.selected).map((m) => ({
          providerId: p.providerId,
          modelId: m.id,
        }))
      );

      assert.strictEqual(selected.length, 2);
      assert.ok(selected.some((s) => s.providerId === "openai" && s.modelId === "gpt-4"));
      assert.ok(selected.some((s) => s.providerId === "claude" && s.modelId === "claude-3"));
    });
  });

  describe("navigation", () => {
    it("moves down from provider header to first model", () => {
      const selector = createTestSelector({
        providers: [
          {
            providerId: "openai",
            displayName: "OpenAI",
            models: [
              { id: "gpt-4", displayName: "GPT-4", tier: "flagship" },
              { id: "gpt-3.5", displayName: "GPT-3.5", tier: "standard" },
            ],
          },
        ],
      });

      assert.strictEqual(selector.getState().cursorModel, -1); // On header
      simulateKeyPress(selector, "down");
      assert.strictEqual(selector.getState().cursorModel, 0); // On first model
    });

    it("moves up from first model to provider header", () => {
      const selector = createTestSelector({
        providers: [
          {
            providerId: "openai",
            displayName: "OpenAI",
            models: [{ id: "gpt-4", displayName: "GPT-4", tier: "flagship" }],
          },
        ],
      });

      simulateKeyPress(selector, "down"); // Move to model
      assert.strictEqual(selector.getState().cursorModel, 0);
      simulateKeyPress(selector, "up");
      assert.strictEqual(selector.getState().cursorModel, -1); // Back to header
    });

    it("moves between providers", () => {
      const selector = createTestSelector({
        providers: [
          {
            providerId: "openai",
            displayName: "OpenAI",
            models: [{ id: "gpt-4", displayName: "GPT-4", tier: "flagship" }],
          },
          {
            providerId: "claude",
            displayName: "Claude",
            models: [{ id: "claude-3", displayName: "Claude 3", tier: "flagship" }],
          },
        ],
      });

      assert.strictEqual(selector.getState().cursorProvider, 0);
      simulateKeyPress(selector, "down"); // OpenAI model
      simulateKeyPress(selector, "down"); // Claude header
      assert.strictEqual(selector.getState().cursorProvider, 1);
      assert.strictEqual(selector.getState().cursorModel, -1);
    });

    it("does not move past last provider", () => {
      const selector = createTestSelector({
        providers: [
          {
            providerId: "openai",
            displayName: "OpenAI",
            models: [{ id: "gpt-4", displayName: "GPT-4", tier: "flagship" }],
          },
        ],
      });

      simulateKeyPress(selector, "down"); // To model
      simulateKeyPress(selector, "down"); // Try to go beyond
      simulateKeyPress(selector, "down"); // Try again

      const state = selector.getState();
      assert.strictEqual(state.cursorProvider, 0);
      assert.strictEqual(state.cursorModel, 0); // Stays on last model
    });

    it("does not move before first provider", () => {
      const selector = createTestSelector({
        providers: [
          {
            providerId: "openai",
            displayName: "OpenAI",
            models: [{ id: "gpt-4", displayName: "GPT-4", tier: "flagship" }],
          },
        ],
      });

      simulateKeyPress(selector, "up"); // Try to go before
      simulateKeyPress(selector, "up"); // Try again

      const state = selector.getState();
      assert.strictEqual(state.cursorProvider, 0);
      assert.strictEqual(state.cursorModel, -1);
    });
  });

  describe("provider toggle", () => {
    it("collapses provider when on provider header", () => {
      const selector = createTestSelector({
        providers: [
          {
            providerId: "openai",
            displayName: "OpenAI",
            models: [{ id: "gpt-4", displayName: "GPT-4", tier: "flagship" }],
          },
        ],
      });

      assert.ok(selector.getState().expanded.has("openai"));
      simulateKeyPress(selector, "space"); // Toggle on header
      assert.ok(!selector.getState().expanded.has("openai"));
    });

    it("expands collapsed provider", () => {
      const selector = createTestSelector({
        providers: [
          {
            providerId: "openai",
            displayName: "OpenAI",
            models: [{ id: "gpt-4", displayName: "GPT-4", tier: "flagship" }],
          },
        ],
      });

      simulateKeyPress(selector, "space"); // Collapse
      assert.ok(!selector.getState().expanded.has("openai"));
      simulateKeyPress(selector, "space"); // Expand
      assert.ok(selector.getState().expanded.has("openai"));
    });

    it("skips collapsed provider models when navigating", () => {
      const selector = createTestSelector({
        providers: [
          {
            providerId: "openai",
            displayName: "OpenAI",
            models: [{ id: "gpt-4", displayName: "GPT-4", tier: "flagship" }],
          },
          {
            providerId: "claude",
            displayName: "Claude",
            models: [{ id: "claude-3", displayName: "Claude 3", tier: "flagship" }],
          },
        ],
      });

      simulateKeyPress(selector, "space"); // Collapse OpenAI
      simulateKeyPress(selector, "down"); // Should skip to Claude header

      const state = selector.getState();
      assert.strictEqual(state.cursorProvider, 1);
      assert.strictEqual(state.cursorModel, -1); // On Claude header
    });
  });

  describe("error handling", () => {
    it("sets error message when limit exceeded", () => {
      const selector = createTestSelector({
        providers: [
          {
            providerId: "openai",
            displayName: "OpenAI",
            models: [
              { id: "m1", displayName: "Model 1", tier: "standard" },
              { id: "m2", displayName: "Model 2", tier: "standard" },
              { id: "m3", displayName: "Model 3", tier: "standard" },
              { id: "m4", displayName: "Model 4", tier: "standard" },
              { id: "m5", displayName: "Model 5", tier: "standard" },
            ],
          },
        ],
      });

      // Select 4 models
      for (let i = 0; i < 4; i++) {
        simulateKeyPress(selector, "down");
        simulateKeyPress(selector, "space");
      }

      assert.strictEqual(selector.getState().errorMessage, null);

      // Try to select 5th
      simulateKeyPress(selector, "down");
      simulateKeyPress(selector, "space");

      assert.strictEqual(selector.getState().errorMessage, "Max 4 models per provider");
    });

    it("clears error when toggling successfully", () => {
      const selector = createTestSelector({
        providers: [
          {
            providerId: "openai",
            displayName: "OpenAI",
            models: [
              { id: "m1", displayName: "Model 1", tier: "standard" },
              { id: "m2", displayName: "Model 2", tier: "standard" },
              { id: "m3", displayName: "Model 3", tier: "standard" },
              { id: "m4", displayName: "Model 4", tier: "standard" },
              { id: "m5", displayName: "Model 5", tier: "standard" },
            ],
          },
        ],
      });

      // Select 4 models and trigger error
      for (let i = 0; i < 5; i++) {
        simulateKeyPress(selector, "down");
        simulateKeyPress(selector, "space");
      }

      assert.strictEqual(selector.getState().errorMessage, "Max 4 models per provider");

      // Deselect one
      simulateKeyPress(selector, "up");
      simulateKeyPress(selector, "space"); // Deselect

      assert.strictEqual(selector.getState().errorMessage, null);
    });
  });
});

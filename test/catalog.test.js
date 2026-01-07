import { describe, it } from "node:test";
import assert from "node:assert";
import {
  MODEL_CATALOG,
  getDefaultModels,
  getProviderDisplayName,
} from "../dist/catalog/index.js";

describe("catalog", () => {
  describe("MODEL_CATALOG", () => {
    it("contains all three providers", () => {
      const providerIds = MODEL_CATALOG.map((p) => p.providerId);
      assert.ok(providerIds.includes("openai"));
      assert.ok(providerIds.includes("claude"));
      assert.ok(providerIds.includes("gemini"));
    });

    it("each provider has models with required fields", () => {
      for (const provider of MODEL_CATALOG) {
        assert.ok(provider.providerId, "providerId should exist");
        assert.ok(provider.displayName, "displayName should exist");
        assert.ok(Array.isArray(provider.models), "models should be an array");
        assert.ok(provider.models.length > 0, "should have at least one model");

        for (const model of provider.models) {
          assert.ok(model.id, "model id should exist");
          assert.ok(model.displayName, "model displayName should exist");
          assert.ok(
            ["flagship", "standard", "fast", "legacy"].includes(model.tier),
            `model tier should be valid: ${model.tier}`
          );
        }
      }
    });

    it("each provider has at least one fast tier model", () => {
      for (const provider of MODEL_CATALOG) {
        const fastModels = provider.models.filter((m) => m.tier === "fast");
        assert.ok(
          fastModels.length > 0,
          `${provider.providerId} should have fast tier models`
        );
      }
    });
  });

  describe("getDefaultModels", () => {
    it("returns fast tier models for openai", () => {
      const models = getDefaultModels("openai");
      assert.ok(Array.isArray(models));
      assert.ok(models.length > 0);
      assert.ok(models.includes("gpt-5-nano") || models.includes("gpt-4.1-nano"));
    });

    it("returns fast tier models for claude", () => {
      const models = getDefaultModels("claude");
      assert.ok(Array.isArray(models));
      assert.ok(models.length > 0);
    });

    it("returns fast tier models for gemini", () => {
      const models = getDefaultModels("gemini");
      assert.ok(Array.isArray(models));
      assert.ok(models.length > 0);
    });

    it("returns empty array for unknown provider", () => {
      const models = getDefaultModels("unknown");
      assert.deepStrictEqual(models, []);
    });
  });

  describe("getProviderDisplayName", () => {
    it("returns display name for openai", () => {
      assert.strictEqual(getProviderDisplayName("openai"), "OpenAI");
    });

    it("returns display name for claude", () => {
      assert.strictEqual(getProviderDisplayName("claude"), "Claude");
    });

    it("returns display name for gemini", () => {
      assert.strictEqual(getProviderDisplayName("gemini"), "Gemini");
    });

    it("returns provider id for unknown provider", () => {
      assert.strictEqual(getProviderDisplayName("unknown"), "unknown");
    });
  });
});

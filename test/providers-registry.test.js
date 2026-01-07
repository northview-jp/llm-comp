import { describe, it, mock, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  runProvider,
  runAll,
  runProviderWithModel,
} from "../dist/providers/registry.js";
import { isProviderFailure, isProviderSuccess } from "../dist/types/provider.js";

describe("providers/registry", () => {
  let originalEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("runProvider", () => {
    it("should return disabled error when enabled is false", async () => {
      const result = await runProvider("openai", "test prompt", { model: "gpt-4" }, false);

      assert.equal(result.kind, "failure");
      assert.equal(result.failureType, "disabled");
      assert.equal(result.provider, "openai");
    });

    it("should return api_key_missing when API key not set", async () => {
      delete process.env.OPENAI_API_KEY;
      const result = await runProvider("openai", "test prompt", { model: "gpt-4" }, true);

      assert.equal(result.kind, "failure");
      assert.equal(result.failureType, "api_key_missing");
    });
  });

  describe("runAll", () => {
    it("should return disabled for all providers when all disabled", async () => {
      const configs = {
        openai: { model: "gpt-4" },
        claude: { model: "claude-3-opus" },
        gemini: { model: "gemini-pro" },
      };
      const enabled = {
        openai: false,
        claude: false,
        gemini: false,
      };

      const results = await runAll("test", configs, enabled);

      assert.equal(results.length, 3);
      for (const result of results) {
        assert.equal(result.kind, "failure");
        assert.equal(result.failureType, "disabled");
      }
    });

    it("should run enabled providers and skip disabled ones", async () => {
      delete process.env.OPENAI_API_KEY;
      delete process.env.ANTHROPIC_API_KEY;
      delete process.env.GEMINI_API_KEY;

      const configs = {
        openai: { model: "gpt-4" },
        claude: { model: "claude-3-opus" },
        gemini: { model: "gemini-pro" },
      };
      const enabled = {
        openai: true,
        claude: false,
        gemini: true,
      };

      const results = await runAll("test", configs, enabled);

      assert.equal(results.length, 3);

      const openaiResult = results.find((r) => r.provider === "openai");
      const claudeResult = results.find((r) => r.provider === "claude");
      const geminiResult = results.find((r) => r.provider === "gemini");

      assert.equal(openaiResult.failureType, "api_key_missing");
      assert.equal(claudeResult.failureType, "disabled");
      assert.equal(geminiResult.failureType, "api_key_missing");
    });

    it("should handle provider errors gracefully", async () => {
      delete process.env.OPENAI_API_KEY;

      const configs = {
        openai: { model: "gpt-4" },
        claude: { model: "opus" },
        gemini: { model: "pro" },
      };
      const enabled = {
        openai: true,
        claude: false,
        gemini: false,
      };

      const results = await runAll("test", configs, enabled);

      assert.equal(results.length, 3);
      const openaiResult = results.find((r) => r.provider === "openai");
      assert.equal(isProviderFailure(openaiResult), true);
    });
  });

  describe("runProviderWithModel", () => {
    it("should return api_key_missing when API key not set", async () => {
      delete process.env.OPENAI_API_KEY;

      const result = await runProviderWithModel(
        "openai",
        "gpt-4-turbo",
        "test prompt",
        { model: "gpt-4" }
      );

      assert.equal(result.kind, "failure");
      assert.equal(result.failureType, "api_key_missing");
    });

    it("should use provided modelId instead of config model", async () => {
      delete process.env.ANTHROPIC_API_KEY;

      const result = await runProviderWithModel(
        "claude",
        "claude-3-sonnet",
        "test prompt",
        { model: "claude-3-opus" }
      );

      assert.equal(result.kind, "failure");
      assert.equal(result.failureType, "api_key_missing");
    });
  });
});

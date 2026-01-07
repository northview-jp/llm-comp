import { describe, it, mock, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  extractTokens,
  asModelList,
  extractErrorMessage,
  shouldTryNextModel,
  createApiError,
  createSuccess,
  runWithFallback,
} from "../dist/providers/base.js";

describe("providers/base", () => {
  describe("extractTokens", () => {
    it("should extract tokens for OpenAI format", () => {
      const raw = {
        usage: {
          prompt_tokens: 10,
          completion_tokens: 20,
        },
      };
      const tokens = extractTokens("openai", raw);
      assert.deepEqual(tokens, { input_tokens: 10, output_tokens: 20 });
    });

    it("should extract tokens for Claude format", () => {
      const raw = {
        usage: {
          input_tokens: 15,
          output_tokens: 25,
        },
      };
      const tokens = extractTokens("claude", raw);
      assert.deepEqual(tokens, { input_tokens: 15, output_tokens: 25 });
    });

    it("should extract tokens for Gemini format", () => {
      const raw = {
        usageMetadata: {
          promptTokenCount: 12,
          candidatesTokenCount: 30,
        },
      };
      const tokens = extractTokens("gemini", raw);
      assert.deepEqual(tokens, { input_tokens: 12, output_tokens: 30 });
    });

    it("should return undefined for missing usage", () => {
      assert.equal(extractTokens("openai", {}), undefined);
      assert.equal(extractTokens("claude", {}), undefined);
      assert.equal(extractTokens("gemini", {}), undefined);
    });

    it("should return undefined for null input", () => {
      assert.equal(extractTokens("openai", null), undefined);
      assert.equal(extractTokens("openai", undefined), undefined);
    });

    it("should return undefined for unknown provider", () => {
      const raw = { usage: { input_tokens: 10, output_tokens: 20 } };
      assert.equal(extractTokens("unknown", raw), undefined);
    });
  });

  describe("asModelList", () => {
    it("should wrap string in array", () => {
      assert.deepEqual(asModelList("gpt-4"), ["gpt-4"]);
    });

    it("should return array as-is", () => {
      assert.deepEqual(asModelList(["gpt-4", "gpt-4o"]), ["gpt-4", "gpt-4o"]);
    });

    it("should return empty array as-is", () => {
      assert.deepEqual(asModelList([]), []);
    });
  });

  describe("extractErrorMessage", () => {
    it("should extract error.message from response", () => {
      const res = {
        ok: false,
        status: 400,
        data: { error: { message: "Invalid request" } },
      };
      assert.equal(extractErrorMessage(res), "Invalid request");
    });

    it("should extract data.message from response", () => {
      const res = {
        ok: false,
        status: 400,
        data: { message: "Something went wrong" },
      };
      assert.equal(extractErrorMessage(res), "Something went wrong");
    });

    it("should fall back to text", () => {
      const res = {
        ok: false,
        status: 500,
        text: "Internal Server Error",
      };
      assert.equal(extractErrorMessage(res), "Internal Server Error");
    });

    it("should fall back to HTTP status", () => {
      const res = {
        ok: false,
        status: 503,
      };
      assert.equal(extractErrorMessage(res), "HTTP 503");
    });
  });

  describe("shouldTryNextModel", () => {
    it("should return true for model not found errors with valid status", () => {
      assert.equal(shouldTryNextModel("model not found", 404, 1), true);
      assert.equal(shouldTryNextModel("Model not supported", 400, 2), true);
    });

    it("should return true for overloaded errors", () => {
      assert.equal(shouldTryNextModel("Server overloaded", 503, 1), true);
      assert.equal(shouldTryNextModel("Please try again later", 529, 1), true);
    });

    it("should return false for rate limit without pattern match", () => {
      assert.equal(shouldTryNextModel("Rate limited", 429, 1), false);
    });

    it("should return false for non-fallback status codes", () => {
      assert.equal(shouldTryNextModel("model not found", 500, 1), false);
      assert.equal(shouldTryNextModel("model not found", 401, 1), false);
    });

    it("should return false when no models remaining", () => {
      assert.equal(shouldTryNextModel("model not found", 404, 0), false);
    });

    it("should return false when error pattern does not match", () => {
      assert.equal(shouldTryNextModel("authentication failed", 400, 1), false);
      assert.equal(shouldTryNextModel("invalid api key", 404, 1), false);
    });

    it("should be case insensitive", () => {
      assert.equal(shouldTryNextModel("MODEL NOT FOUND", 404, 1), true);
      assert.equal(shouldTryNextModel("UNKNOWN model", 400, 1), true);
    });
  });

  describe("createApiError", () => {
    it("should create failure object with correct shape", () => {
      const res = {
        ok: false,
        status: 400,
        data: { error: { message: "Bad request" } },
      };
      const error = createApiError("openai", "gpt-4", res, 150);

      assert.equal(error.kind, "failure");
      assert.equal(error.failureType, "api_error");
      assert.equal(error.provider, "openai");
      assert.equal(error.model, "gpt-4");
      assert.equal(error.message, "Bad request");
      assert.equal(error.status, 400);
      assert.equal(error.elapsed_ms, 150);
    });

    it("should include details from response", () => {
      const res = {
        ok: false,
        status: 500,
        data: { error: { message: "Error", code: "internal" } },
      };
      const error = createApiError("claude", "opus", res, 200);
      assert.deepEqual(error.details, res.data);
    });

    it("should use text as details when data is missing", () => {
      const res = {
        ok: false,
        status: 500,
        text: "Server error",
      };
      const error = createApiError("gemini", "flash", res, 100);
      assert.equal(error.details, "Server error");
    });
  });

  describe("createSuccess", () => {
    it("should create success object with tokens", () => {
      const raw = { usage: { prompt_tokens: 10, completion_tokens: 20 } };
      const result = createSuccess("openai", "gpt-4", "Hello!", raw, 100);

      assert.equal(result.kind, "success");
      assert.equal(result.provider, "openai");
      assert.equal(result.model, "gpt-4");
      assert.equal(result.text, "Hello!");
      assert.equal(result.elapsed_ms, 100);
      assert.deepEqual(result.tokens, { input_tokens: 10, output_tokens: 20 });
      assert.equal(result.raw, raw);
    });

    it("should handle missing tokens", () => {
      const raw = {};
      const result = createSuccess("openai", "gpt-4", "Hi", raw, 50);
      assert.equal(result.tokens, undefined);
    });

    it("should replace empty text with placeholder", () => {
      const result = createSuccess("openai", "gpt-4", "", {}, 50);
      assert.equal(result.text, "(empty response)");
    });
  });

  describe("runWithFallback", () => {
    let originalEnv;

    beforeEach(() => {
      originalEnv = { ...process.env };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it("should return api_key_missing when API key is not set", async () => {
      delete process.env.TEST_API_KEY;

      const spec = {
        providerId: "openai",
        apiKeyEnvVar: "TEST_API_KEY",
        getEndpoint: () => "http://test",
        getHeaders: () => ({}),
        buildBody: () => ({}),
        extractText: () => "",
      };

      const result = await runWithFallback("test", { model: "gpt-4" }, spec);

      assert.equal(result.kind, "failure");
      assert.equal(result.failureType, "api_key_missing");
      assert.ok(result.message.includes("TEST_API_KEY"));
    });

    it("should handle timeout", async () => {
      process.env.TEST_API_KEY = "test-key";

      const mockPostJson = mock.fn(async () => ({
        ok: false,
        isTimeout: true,
        status: 0,
      }));

      const spec = {
        providerId: "openai",
        apiKeyEnvVar: "TEST_API_KEY",
        getEndpoint: () => "http://test",
        getHeaders: () => ({}),
        buildBody: () => ({}),
        extractText: () => "",
        postJson: mockPostJson,
      };

      const result = await runWithFallback(
        "test",
        { model: "gpt-4", timeout_ms: 1000 },
        spec
      );

      assert.equal(result.kind, "failure");
      assert.equal(result.failureType, "timeout");
      assert.equal(result.model, "gpt-4");
    });

    it("should return success on OK response", async () => {
      process.env.TEST_API_KEY = "test-key";

      const mockPostJson = mock.fn(async () => ({
        ok: true,
        status: 200,
        data: { usage: { prompt_tokens: 5, completion_tokens: 10 } },
      }));

      const spec = {
        providerId: "openai",
        apiKeyEnvVar: "TEST_API_KEY",
        getEndpoint: () => "http://test",
        getHeaders: () => ({}),
        buildBody: () => ({}),
        extractText: () => "Hello world",
        postJson: mockPostJson,
      };

      const result = await runWithFallback("test", { model: "gpt-4" }, spec);

      assert.equal(result.kind, "success");
      assert.equal(result.text, "Hello world");
      assert.deepEqual(result.tokens, { input_tokens: 5, output_tokens: 10 });
    });

    it("should fallback to next model on model error", async () => {
      process.env.TEST_API_KEY = "test-key";

      let callCount = 0;
      const mockPostJson = mock.fn(async () => {
        callCount++;
        if (callCount === 1) {
          return {
            ok: false,
            status: 404,
            data: { error: { message: "Model not found" } },
          };
        }
        return {
          ok: true,
          status: 200,
          data: {},
        };
      });

      const spec = {
        providerId: "openai",
        apiKeyEnvVar: "TEST_API_KEY",
        getEndpoint: () => "http://test",
        getHeaders: () => ({}),
        buildBody: () => ({}),
        extractText: () => "Success",
        postJson: mockPostJson,
      };

      const result = await runWithFallback(
        "test",
        { model: ["gpt-4-turbo", "gpt-4"] },
        spec
      );

      assert.equal(result.kind, "success");
      assert.equal(callCount, 2);
    });

    it("should return error when all models fail", async () => {
      process.env.TEST_API_KEY = "test-key";

      const mockPostJson = mock.fn(async () => ({
        ok: false,
        status: 404,
        data: { error: { message: "Model not found" } },
      }));

      const spec = {
        providerId: "openai",
        apiKeyEnvVar: "TEST_API_KEY",
        getEndpoint: () => "http://test",
        getHeaders: () => ({}),
        buildBody: () => ({}),
        extractText: () => "",
        postJson: mockPostJson,
      };

      const result = await runWithFallback(
        "test",
        { model: ["model-1", "model-2"] },
        spec
      );

      assert.equal(result.kind, "failure");
      assert.equal(result.failureType, "api_error");
    });
  });
});

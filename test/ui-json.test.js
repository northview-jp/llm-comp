import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import { printJson } from "../dist/ui/json.js";

describe("ui/json", () => {
  let originalStdoutWrite;
  let capturedOutput;

  beforeEach(() => {
    capturedOutput = "";
    originalStdoutWrite = process.stdout.write;
    process.stdout.write = (chunk) => {
      capturedOutput += chunk;
      return true;
    };
  });

  afterEach(() => {
    process.stdout.write = originalStdoutWrite;
  });

  describe("printJson", () => {
    it("formats success results correctly", () => {
      const results = [
        {
          kind: "success",
          provider: "openai",
          model: "gpt-4",
          elapsed_ms: 1000,
          text: "Hello world",
        },
      ];

      printJson(results);
      const parsed = JSON.parse(capturedOutput.trim());

      assert.strictEqual(parsed.length, 1);
      assert.strictEqual(parsed[0].provider, "openai");
      assert.strictEqual(parsed[0].model, "gpt-4");
      assert.strictEqual(parsed[0].elapsed_ms, 1000);
      assert.strictEqual(parsed[0].text, "Hello world");
      assert.strictEqual(parsed[0].error, undefined);
    });

    it("formats error results correctly", () => {
      const results = [
        {
          kind: "failure",
          failureType: "api_error",
          provider: "claude",
          model: "claude-3",
          elapsed_ms: 500,
          message: "Rate limit exceeded",
          status: 429,
        },
      ];

      printJson(results);
      const parsed = JSON.parse(capturedOutput.trim());

      assert.strictEqual(parsed.length, 1);
      assert.strictEqual(parsed[0].provider, "claude");
      assert.strictEqual(parsed[0].model, "claude-3");
      assert.strictEqual(parsed[0].elapsed_ms, 500);
      assert.strictEqual(parsed[0].error, "Rate limit exceeded");
      assert.strictEqual(parsed[0].status, 429);
      assert.strictEqual(parsed[0].text, undefined);
    });

    it("handles mixed success and error results", () => {
      const results = [
        {
          kind: "success",
          provider: "openai",
          model: "gpt-4",
          elapsed_ms: 1000,
          text: "Success response",
        },
        {
          kind: "failure",
          failureType: "timeout",
          provider: "gemini",
          model: "gemini-2",
          elapsed_ms: 30000,
          message: "Request timed out",
          status: 0,
        },
      ];

      printJson(results);
      const parsed = JSON.parse(capturedOutput.trim());

      assert.strictEqual(parsed.length, 2);
      assert.strictEqual(parsed[0].text, "Success response");
      assert.strictEqual(parsed[1].error, "Request timed out");
    });

    it("outputs empty array for no results", () => {
      printJson([]);
      const parsed = JSON.parse(capturedOutput.trim());

      assert.deepStrictEqual(parsed, []);
    });

    it("outputs valid JSON with newline", () => {
      printJson([]);
      assert.ok(capturedOutput.endsWith("\n"), "should end with newline");
    });

    it("formats output with indentation", () => {
      const results = [
        {
          kind: "success",
          provider: "openai",
          model: "gpt-4",
          elapsed_ms: 100,
          text: "test",
        },
      ];

      printJson(results);
      // Check for indentation (2 spaces)
      assert.ok(capturedOutput.includes("  "), "should have indentation");
    });
  });
});

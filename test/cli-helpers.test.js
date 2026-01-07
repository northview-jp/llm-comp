import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import { shouldSkipDotEnv, getHelpText, parseArgs } from "../dist/cli-helpers.js";

describe("cli-helpers", () => {
  describe("shouldSkipDotEnv", () => {
    let originalEnv;

    beforeEach(() => {
      originalEnv = process.env.LLM_COMP_SKIP_DOTENV;
    });

    afterEach(() => {
      if (originalEnv === undefined) {
        delete process.env.LLM_COMP_SKIP_DOTENV;
      } else {
        process.env.LLM_COMP_SKIP_DOTENV = originalEnv;
      }
    });

    it("returns false when env var is not set", () => {
      delete process.env.LLM_COMP_SKIP_DOTENV;
      assert.strictEqual(shouldSkipDotEnv(), false);
    });

    it("returns false when env var is empty string", () => {
      process.env.LLM_COMP_SKIP_DOTENV = "";
      assert.strictEqual(shouldSkipDotEnv(), false);
    });

    it("returns true for '1'", () => {
      process.env.LLM_COMP_SKIP_DOTENV = "1";
      assert.strictEqual(shouldSkipDotEnv(), true);
    });

    it("returns true for 'true' (case insensitive)", () => {
      process.env.LLM_COMP_SKIP_DOTENV = "true";
      assert.strictEqual(shouldSkipDotEnv(), true);

      process.env.LLM_COMP_SKIP_DOTENV = "TRUE";
      assert.strictEqual(shouldSkipDotEnv(), true);

      process.env.LLM_COMP_SKIP_DOTENV = "True";
      assert.strictEqual(shouldSkipDotEnv(), true);
    });

    it("returns true for 'yes' (case insensitive)", () => {
      process.env.LLM_COMP_SKIP_DOTENV = "yes";
      assert.strictEqual(shouldSkipDotEnv(), true);

      process.env.LLM_COMP_SKIP_DOTENV = "YES";
      assert.strictEqual(shouldSkipDotEnv(), true);
    });

    it("returns true for 'y' (case insensitive)", () => {
      process.env.LLM_COMP_SKIP_DOTENV = "y";
      assert.strictEqual(shouldSkipDotEnv(), true);

      process.env.LLM_COMP_SKIP_DOTENV = "Y";
      assert.strictEqual(shouldSkipDotEnv(), true);
    });

    it("returns true for 'on' (case insensitive)", () => {
      process.env.LLM_COMP_SKIP_DOTENV = "on";
      assert.strictEqual(shouldSkipDotEnv(), true);

      process.env.LLM_COMP_SKIP_DOTENV = "ON";
      assert.strictEqual(shouldSkipDotEnv(), true);
    });

    it("returns false for '0'", () => {
      process.env.LLM_COMP_SKIP_DOTENV = "0";
      assert.strictEqual(shouldSkipDotEnv(), false);
    });

    it("returns false for 'false'", () => {
      process.env.LLM_COMP_SKIP_DOTENV = "false";
      assert.strictEqual(shouldSkipDotEnv(), false);
    });

    it("returns false for 'no'", () => {
      process.env.LLM_COMP_SKIP_DOTENV = "no";
      assert.strictEqual(shouldSkipDotEnv(), false);
    });

    it("handles whitespace around value", () => {
      process.env.LLM_COMP_SKIP_DOTENV = "  1  ";
      assert.strictEqual(shouldSkipDotEnv(), true);

      process.env.LLM_COMP_SKIP_DOTENV = "  true  ";
      assert.strictEqual(shouldSkipDotEnv(), true);
    });
  });

  describe("getHelpText", () => {
    it("returns non-empty help text", () => {
      const help = getHelpText();
      assert.ok(help.length > 0);
    });

    it("includes usage information", () => {
      const help = getHelpText();
      assert.ok(help.includes("Usage:"));
      assert.ok(help.includes("llm-comp"));
    });

    it("includes init command", () => {
      const help = getHelpText();
      assert.ok(help.includes("init"));
    });

    it("includes config file locations", () => {
      const help = getHelpText();
      assert.ok(help.includes("llm-comp.yaml"));
      assert.ok(help.includes(".env"));
    });
  });

  describe("parseArgs", () => {
    it("returns empty prompt for empty argv", () => {
      const result = parseArgs([]);
      assert.strictEqual(result.command, undefined);
      assert.strictEqual(result.prompt, "");
    });

    it("returns init command for 'init' argument", () => {
      const result = parseArgs(["init"]);
      assert.strictEqual(result.command, "init");
      assert.strictEqual(result.prompt, "");
    });

    it("joins multiple arguments as prompt", () => {
      const result = parseArgs(["hello", "world"]);
      assert.strictEqual(result.command, undefined);
      assert.strictEqual(result.prompt, "hello world");
    });

    it("trims prompt", () => {
      const result = parseArgs(["  hello  ", "  world  "]);
      // Arguments are joined with space, then final result is trimmed
      assert.strictEqual(result.prompt, "hello     world");
    });

    it("handles single argument prompt", () => {
      const result = parseArgs(["test prompt"]);
      assert.strictEqual(result.command, undefined);
      assert.strictEqual(result.prompt, "test prompt");
    });
  });
});

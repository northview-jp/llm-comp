import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import { extractText, runOpenAI } from "../dist/providers/openai.js";

let originalFetch;
let originalEnv;

beforeEach(() => {
  originalFetch = globalThis.fetch;
  originalEnv = { ...process.env };
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  process.env = originalEnv;
});

describe("OpenAI", () => {
  describe("extractText", () => {
  describe("output_text field", () => {
    it("extracts text from output_text string", () => {
      const payload = { output_text: "Hello world" };
      assert.strictEqual(extractText(payload), "Hello world");
    });

    it("returns empty string for empty output_text", () => {
      const payload = { output_text: "" };
      assert.strictEqual(extractText(payload), "");
    });
  });

  describe("output array (Responses API)", () => {
    it("extracts text from output array with message type", () => {
      const payload = {
        output: [
          {
            type: "message",
            content: [{ text: "First part" }, { text: "Second part" }],
          },
        ],
      };
      assert.strictEqual(extractText(payload), "First part\nSecond part");
    });

    it("extracts output_text from content items", () => {
      const payload = {
        output: [
          {
            type: "message",
            content: [{ output_text: "Response text" }],
          },
        ],
      };
      assert.strictEqual(extractText(payload), "Response text");
    });

    it("handles mixed text and output_text fields", () => {
      const payload = {
        output: [
          {
            type: "message",
            content: [{ text: "Part 1" }, { output_text: "Part 2" }],
          },
        ],
      };
      assert.strictEqual(extractText(payload), "Part 1\nPart 2");
    });

    it("ignores non-message types", () => {
      const payload = {
        output: [
          { type: "other", content: [{ text: "Ignored" }] },
          { type: "message", content: [{ text: "Included" }] },
        ],
      };
      assert.strictEqual(extractText(payload), "Included");
    });

    it("handles empty output array", () => {
      const payload = { output: [] };
      assert.strictEqual(extractText(payload), "");
    });
  });

  describe("choices array (Chat Completion API)", () => {
    it("extracts text from choices[0].message.content", () => {
      const payload = {
        choices: [{ message: { content: "Chat response" } }],
      };
      assert.strictEqual(extractText(payload), "Chat response");
    });

    it("handles empty choices array", () => {
      const payload = { choices: [] };
      assert.strictEqual(extractText(payload), "");
    });

    it("handles choices with missing message", () => {
      const payload = { choices: [{}] };
      assert.strictEqual(extractText(payload), "");
    });

    it("handles choices with missing content", () => {
      const payload = { choices: [{ message: {} }] };
      assert.strictEqual(extractText(payload), "");
    });
  });

  describe("priority order", () => {
    it("prioritizes output_text over output array", () => {
      const payload = {
        output_text: "Primary",
        output: [{ type: "message", content: [{ text: "Secondary" }] }],
      };
      assert.strictEqual(extractText(payload), "Primary");
    });

    it("prioritizes output array over choices", () => {
      const payload = {
        output: [{ type: "message", content: [{ text: "Primary" }] }],
        choices: [{ message: { content: "Secondary" } }],
      };
      assert.strictEqual(extractText(payload), "Primary");
    });
  });

  describe("edge cases", () => {
    it("returns empty string for null payload", () => {
      assert.strictEqual(extractText(null), "");
    });

    it("returns empty string for undefined payload", () => {
      assert.strictEqual(extractText(undefined), "");
    });

    it("returns empty string for non-object payload", () => {
      assert.strictEqual(extractText("string"), "");
      assert.strictEqual(extractText(123), "");
      assert.strictEqual(extractText(true), "");
    });

    it("returns empty string for empty object", () => {
      assert.strictEqual(extractText({}), "");
    });

    it("handles content items with non-object values", () => {
      const payload = {
        output: [
          {
            type: "message",
            content: [null, undefined, "string", { text: "Valid" }],
          },
        ],
      };
      assert.strictEqual(extractText(payload), "Valid");
    });

    it("handles output items with non-object values", () => {
      const payload = {
        output: [null, undefined, { type: "message", content: [{ text: "Valid" }] }],
      };
      assert.strictEqual(extractText(payload), "Valid");
    });
  });
  });

  describe("request body", () => {
    it("sends reasoning.effort for gpt-5.4-pro and omits temperature", async () => {
      let seenBody;
      process.env.OPENAI_API_KEY = "test-key";
      globalThis.fetch = async (_url, init) => {
        seenBody = JSON.parse(init.body);
        return {
          ok: true,
          status: 200,
          text: async () => JSON.stringify({ output_text: "ok" }),
        };
      };

      const result = await runOpenAI("hello", {
        model: "gpt-5.4-pro",
        reasoning_effort: "high",
        temperature: 0.2,
        max_output_tokens: 100,
      });

      assert.strictEqual(result.kind, "success");
      assert.deepStrictEqual(seenBody.reasoning, { effort: "high" });
      assert.strictEqual("temperature" in seenBody, false);
    });

    it("drops unsupported reasoning.effort values for gpt-5.4-pro", async () => {
      let seenBody;
      process.env.OPENAI_API_KEY = "test-key";
      globalThis.fetch = async (_url, init) => {
        seenBody = JSON.parse(init.body);
        return {
          ok: true,
          status: 200,
          text: async () => JSON.stringify({ output_text: "ok" }),
        };
      };

      const result = await runOpenAI("hello", {
        model: "gpt-5.4-pro",
        reasoning_effort: "none",
        max_output_tokens: 100,
      });

      assert.strictEqual(result.kind, "success");
      assert.strictEqual("reasoning" in seenBody, false);
    });

    it("keeps temperature for gpt-5.4 when reasoning.effort is none", async () => {
      let seenBody;
      process.env.OPENAI_API_KEY = "test-key";
      globalThis.fetch = async (_url, init) => {
        seenBody = JSON.parse(init.body);
        return {
          ok: true,
          status: 200,
          text: async () => JSON.stringify({ output_text: "ok" }),
        };
      };

      const result = await runOpenAI("hello", {
        model: "gpt-5.4",
        reasoning_effort: "none",
        temperature: 0.2,
        max_output_tokens: 100,
      });

      assert.strictEqual(result.kind, "success");
      assert.deepStrictEqual(seenBody.reasoning, { effort: "none" });
      assert.strictEqual(seenBody.temperature, 0.2);
    });
  });
});

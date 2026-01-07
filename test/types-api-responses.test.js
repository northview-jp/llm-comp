import { describe, it } from "node:test";
import assert from "node:assert";
import {
  isObject,
  isOpenAIResponse,
  isClaudeResponse,
  isGeminiResponse,
} from "../dist/types/api-responses.js";

describe("types/api-responses", () => {
  describe("isObject", () => {
    it("returns true for plain objects", () => {
      assert.strictEqual(isObject({}), true);
      assert.strictEqual(isObject({ key: "value" }), true);
    });

    it("returns true for arrays", () => {
      assert.strictEqual(isObject([]), true);
      assert.strictEqual(isObject([1, 2, 3]), true);
    });

    it("returns false for null", () => {
      assert.strictEqual(isObject(null), false);
    });

    it("returns false for primitives", () => {
      assert.strictEqual(isObject(undefined), false);
      assert.strictEqual(isObject("string"), false);
      assert.strictEqual(isObject(123), false);
      assert.strictEqual(isObject(true), false);
    });
  });

  describe("isOpenAIResponse", () => {
    it("returns true for response with output_text", () => {
      assert.strictEqual(isOpenAIResponse({ output_text: "Hello" }), true);
    });

    it("returns true for response with output array", () => {
      assert.strictEqual(isOpenAIResponse({ output: [] }), true);
      assert.strictEqual(
        isOpenAIResponse({
          output: [{ type: "message", content: [{ text: "Hi" }] }],
        }),
        true
      );
    });

    it("returns true for response with choices array", () => {
      assert.strictEqual(isOpenAIResponse({ choices: [] }), true);
      assert.strictEqual(
        isOpenAIResponse({
          choices: [{ message: { content: "Hi" } }],
        }),
        true
      );
    });

    it("returns false for non-OpenAI structures", () => {
      assert.strictEqual(isOpenAIResponse({}), false);
      assert.strictEqual(isOpenAIResponse({ content: [] }), false);
      assert.strictEqual(isOpenAIResponse({ candidates: [] }), false);
    });

    it("returns false for non-objects", () => {
      assert.strictEqual(isOpenAIResponse(null), false);
      assert.strictEqual(isOpenAIResponse(undefined), false);
      assert.strictEqual(isOpenAIResponse("string"), false);
    });
  });

  describe("isClaudeResponse", () => {
    it("returns true for response with content array", () => {
      assert.strictEqual(isClaudeResponse({ content: [] }), true);
      assert.strictEqual(
        isClaudeResponse({ content: [{ text: "Hello" }] }),
        true
      );
    });

    it("returns true for response with completion string", () => {
      assert.strictEqual(isClaudeResponse({ completion: "Hello" }), true);
    });

    it("returns false for non-Claude structures", () => {
      assert.strictEqual(isClaudeResponse({}), false);
      assert.strictEqual(isClaudeResponse({ output_text: "Hi" }), false);
      assert.strictEqual(isClaudeResponse({ candidates: [] }), false);
    });

    it("returns false for non-objects", () => {
      assert.strictEqual(isClaudeResponse(null), false);
      assert.strictEqual(isClaudeResponse(undefined), false);
      assert.strictEqual(isClaudeResponse(123), false);
    });
  });

  describe("isGeminiResponse", () => {
    it("returns true for response with candidates array", () => {
      assert.strictEqual(isGeminiResponse({ candidates: [] }), true);
      assert.strictEqual(
        isGeminiResponse({
          candidates: [{ content: { parts: [{ text: "Hi" }] } }],
        }),
        true
      );
    });

    it("returns true for response with promptFeedback object", () => {
      assert.strictEqual(
        isGeminiResponse({ promptFeedback: { blockReason: "SAFETY" } }),
        true
      );
    });

    it("returns true for response with text string", () => {
      assert.strictEqual(isGeminiResponse({ text: "Hello" }), true);
    });

    it("returns false for non-Gemini structures", () => {
      assert.strictEqual(isGeminiResponse({}), false);
      assert.strictEqual(isGeminiResponse({ content: [] }), false);
      assert.strictEqual(isGeminiResponse({ output_text: "Hi" }), false);
    });

    it("returns false for non-objects", () => {
      assert.strictEqual(isGeminiResponse(null), false);
      assert.strictEqual(isGeminiResponse(undefined), false);
      assert.strictEqual(isGeminiResponse(true), false);
    });
  });
});

import { describe, it } from "node:test";
import assert from "node:assert";
import { extractText } from "../dist/providers/gemini.js";

describe("Gemini extractText", () => {
  describe("candidates array", () => {
    it("extracts text from candidates[0].content.parts", () => {
      const payload = {
        candidates: [
          {
            content: {
              parts: [{ text: "Hello from Gemini" }],
            },
          },
        ],
      };
      assert.strictEqual(extractText(payload), "Hello from Gemini");
    });

    it("joins multiple parts", () => {
      const payload = {
        candidates: [
          {
            content: {
              parts: [{ text: "Part 1" }, { text: "Part 2" }],
            },
          },
        ],
      };
      assert.strictEqual(extractText(payload), "Part 1\nPart 2");
    });

    it("handles empty candidates array", () => {
      const payload = { candidates: [] };
      assert.strictEqual(extractText(payload), "[No candidates returned]");
    });

    it("handles candidates with missing content", () => {
      const payload = { candidates: [{}] };
      assert.strictEqual(extractText(payload), "");
    });

    it("handles candidates with empty parts", () => {
      const payload = {
        candidates: [{ content: { parts: [] } }],
      };
      assert.strictEqual(extractText(payload), "");
    });
  });

  describe("promptFeedback blocking", () => {
    it("returns blocked message when promptFeedback.blockReason exists", () => {
      const payload = {
        promptFeedback: { blockReason: "SAFETY" },
      };
      assert.strictEqual(extractText(payload), "[Blocked: SAFETY]");
    });

    it("prioritizes promptFeedback over candidates", () => {
      const payload = {
        promptFeedback: { blockReason: "HARM" },
        candidates: [{ content: { parts: [{ text: "Content" }] } }],
      };
      assert.strictEqual(extractText(payload), "[Blocked: HARM]");
    });
  });

  describe("finishReason handling", () => {
    it("returns no content message for non-STOP finish reason without text", () => {
      const payload = {
        candidates: [
          {
            finishReason: "MAX_TOKENS",
            content: { parts: [] },
          },
        ],
      };
      assert.strictEqual(extractText(payload), "[No content: MAX_TOKENS]");
    });

    it("returns text even with non-STOP finish reason if text exists", () => {
      const payload = {
        candidates: [
          {
            finishReason: "MAX_TOKENS",
            content: { parts: [{ text: "Partial response" }] },
          },
        ],
      };
      assert.strictEqual(extractText(payload), "Partial response");
    });

    it("does not show message for STOP finish reason", () => {
      const payload = {
        candidates: [
          {
            finishReason: "STOP",
            content: { parts: [] },
          },
        ],
      };
      assert.strictEqual(extractText(payload), "");
    });
  });

  describe("text field fallback", () => {
    it("extracts from text field when no candidates", () => {
      const payload = { text: "Direct text" };
      assert.strictEqual(extractText(payload), "Direct text");
    });

    it("prioritizes candidates over text field", () => {
      const payload = {
        candidates: [{ content: { parts: [{ text: "Primary" }] } }],
        text: "Secondary",
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

    it("handles parts with non-object values", () => {
      const payload = {
        candidates: [
          {
            content: {
              parts: [null, undefined, "string", { text: "Valid" }],
            },
          },
        ],
      };
      assert.strictEqual(extractText(payload), "Valid");
    });

    it("handles parts with non-string text", () => {
      const payload = {
        candidates: [
          {
            content: {
              parts: [{ text: 123 }, { text: "Valid" }],
            },
          },
        ],
      };
      assert.strictEqual(extractText(payload), "Valid");
    });
  });
});

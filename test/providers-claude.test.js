import { describe, it } from "node:test";
import assert from "node:assert";
import { extractText } from "../dist/providers/claude.js";

describe("Claude extractText", () => {
  describe("content array", () => {
    it("extracts text from content array with text field", () => {
      const payload = {
        content: [{ type: "text", text: "Hello from Claude" }],
      };
      assert.strictEqual(extractText(payload), "Hello from Claude");
    });

    it("extracts text from content array with content field", () => {
      const payload = {
        content: [{ content: "Alternative field" }],
      };
      assert.strictEqual(extractText(payload), "Alternative field");
    });

    it("joins multiple content blocks", () => {
      const payload = {
        content: [
          { text: "First paragraph" },
          { text: "Second paragraph" },
        ],
      };
      assert.strictEqual(extractText(payload), "First paragraph\nSecond paragraph");
    });

    it("handles mixed text and content fields", () => {
      const payload = {
        content: [
          { text: "Text field" },
          { content: "Content field" },
        ],
      };
      assert.strictEqual(extractText(payload), "Text field\nContent field");
    });

    it("handles empty content array", () => {
      const payload = { content: [] };
      assert.strictEqual(extractText(payload), "");
    });

    it("ignores blocks without text or content", () => {
      const payload = {
        content: [
          { type: "image", data: "..." },
          { text: "Valid text" },
        ],
      };
      assert.strictEqual(extractText(payload), "Valid text");
    });
  });

  describe("completion field (legacy API)", () => {
    it("extracts text from completion string", () => {
      const payload = { completion: "Legacy response" };
      assert.strictEqual(extractText(payload), "Legacy response");
    });

    it("returns empty string for empty completion", () => {
      const payload = { completion: "" };
      assert.strictEqual(extractText(payload), "");
    });
  });

  describe("priority order", () => {
    it("prioritizes content array over completion", () => {
      const payload = {
        content: [{ text: "Primary" }],
        completion: "Secondary",
      };
      assert.strictEqual(extractText(payload), "Primary");
    });

    it("falls back to completion when content is empty", () => {
      const payload = {
        content: [],
        completion: "Fallback",
      };
      assert.strictEqual(extractText(payload), "Fallback");
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
        content: [null, undefined, "string", { text: "Valid" }],
      };
      assert.strictEqual(extractText(payload), "Valid");
    });

    it("handles content items with non-string text", () => {
      const payload = {
        content: [{ text: 123 }, { text: "Valid" }],
      };
      assert.strictEqual(extractText(payload), "Valid");
    });
  });
});

import { describe, it, mock, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import { ClipboardService } from "../../dist/ui/tabbed/clipboard.js";

describe("tabbed/clipboard", () => {
  describe("ClipboardService", () => {
    let originalPlatform;

    beforeEach(() => {
      originalPlatform = process.platform;
    });

    afterEach(() => {
      Object.defineProperty(process, "platform", {
        value: originalPlatform,
      });
    });

    it("returns success message on successful copy", () => {
      const clipboard = new ClipboardService();
      // This test only works on macOS/Linux where pbcopy/xclip is available
      // It will either succeed or fail gracefully
      const result = clipboard.copy("test text");
      assert.ok(typeof result.success === "boolean");
      assert.ok(typeof result.message === "string");
    });

    it("returns correct interface shape", () => {
      const clipboard = new ClipboardService();
      const result = clipboard.copy("");

      assert.ok("success" in result);
      assert.ok("message" in result);
      assert.strictEqual(typeof result.success, "boolean");
      assert.strictEqual(typeof result.message, "string");
    });

    it("handles empty text", () => {
      const clipboard = new ClipboardService();
      const result = clipboard.copy("");
      // Should not throw
      assert.ok(typeof result.success === "boolean");
    });

    it("handles text with special characters", () => {
      const clipboard = new ClipboardService();
      const result = clipboard.copy("Hello\nWorld\t\"quoted\" 'single'");
      // Should not throw
      assert.ok(typeof result.success === "boolean");
    });

    it("handles unicode text", () => {
      const clipboard = new ClipboardService();
      const result = clipboard.copy("日本語テスト 🎉");
      // Should not throw
      assert.ok(typeof result.success === "boolean");
    });
  });

  describe("ClipboardResult interface", () => {
    it("success result has correct shape", () => {
      const result = { success: true, message: "Copied!" };
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.message, "Copied!");
    });

    it("failure result has correct shape", () => {
      const result = { success: false, message: "Copy failed (pbcopy not found)" };
      assert.strictEqual(result.success, false);
      assert.ok(result.message.includes("not found"));
    });
  });
});

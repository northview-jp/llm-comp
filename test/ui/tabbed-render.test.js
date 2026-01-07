import { describe, it } from "node:test";
import assert from "node:assert";
import {
  statusIcon,
  renderPanelHeader,
  getContentLines,
} from "../../dist/ui/tabbed/render.js";

describe("tabbed/render", () => {
  describe("statusIcon", () => {
    it("returns spinner for loading status", () => {
      const icon = statusIcon("loading", 0);
      assert.ok(icon.length > 0);
    });

    it("returns checkmark for done status", () => {
      const icon = statusIcon("done", 0);
      assert.ok(icon.includes("✔"));
    });

    it("returns cross for error status", () => {
      const icon = statusIcon("error", 0);
      assert.ok(icon.includes("✘"));
    });

    it("returns circle for skipped status", () => {
      const icon = statusIcon("skipped", 0);
      assert.ok(icon.includes("○"));
    });

    it("returns circle for undefined status", () => {
      const icon = statusIcon(undefined, 0);
      assert.ok(icon.includes("○"));
    });
  });

  describe("renderPanelHeader", () => {
    it("includes panel number", () => {
      const header = renderPanelHeader(1, "Test Model", "done", 0, 50);
      assert.ok(header.includes("[1]"));
    });

    it("includes label", () => {
      const header = renderPanelHeader(1, "gpt-4", "done", 0, 50);
      assert.ok(header.includes("gpt-4"));
    });

    it("includes status icon", () => {
      const header = renderPanelHeader(1, "Test", "done", 0, 50);
      assert.ok(header.includes("✔"));
    });

    it("truncates long labels", () => {
      const longLabel = "a".repeat(100);
      const header = renderPanelHeader(1, longLabel, "done", 0, 20);
      assert.ok(header.length < 100);
    });
  });

  describe("getContentLines", () => {
    it("returns waiting message for loading status", () => {
      const state = { status: "loading" };
      const lines = getContentLines(state, 80);
      assert.ok(lines.some((l) => l.includes("Waiting")));
    });

    it("includes elapsed time for loading with startedAt", () => {
      const state = { status: "loading", startedAt: Date.now() - 5000 };
      const lines = getContentLines(state, 80);
      const joined = lines.join("");
      assert.ok(joined.includes("s)"));
    });

    it("returns error message for error status", () => {
      const state = { status: "error", error: "Something went wrong" };
      const lines = getContentLines(state, 80);
      assert.ok(lines.some((l) => l.includes("Error")));
      assert.ok(lines.some((l) => l.includes("Something went wrong")));
    });

    it("returns skipped message for skipped status", () => {
      const state = { status: "skipped", error: "API key missing" };
      const lines = getContentLines(state, 80);
      assert.ok(lines.some((l) => l.includes("Skipped")));
    });

    it("returns wrapped text for done status", () => {
      const state = { status: "done", text: "Hello world" };
      const lines = getContentLines(state, 80);
      assert.ok(lines.some((l) => l.includes("Hello world")));
    });

    it("handles empty text for done status", () => {
      const state = { status: "done", text: "" };
      const lines = getContentLines(state, 80);
      assert.ok(Array.isArray(lines));
    });
  });
});

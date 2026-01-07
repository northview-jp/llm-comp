import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import fs from "fs";
import path from "path";
import os from "os";
import { initProjectFiles } from "../dist/init.js";

describe("init", () => {
  let tempDir;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "llm-comp-test-"));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe("initProjectFiles", () => {
    it("creates llm-comp.yaml and .env when they do not exist", () => {
      const result = initProjectFiles(tempDir);

      assert.deepStrictEqual(result.created.sort(), ["./.env", "./llm-comp.yaml"].sort());
      assert.deepStrictEqual(result.skipped, []);

      const yamlPath = path.join(tempDir, "llm-comp.yaml");
      const envPath = path.join(tempDir, ".env");

      assert.ok(fs.existsSync(yamlPath), "llm-comp.yaml should exist");
      assert.ok(fs.existsSync(envPath), ".env should exist");
    });

    it("skips llm-comp.yaml when it already exists", () => {
      const yamlPath = path.join(tempDir, "llm-comp.yaml");
      fs.writeFileSync(yamlPath, "existing content");

      const result = initProjectFiles(tempDir);

      assert.ok(result.created.includes("./.env"));
      assert.ok(result.skipped.includes("./llm-comp.yaml"));
      assert.strictEqual(fs.readFileSync(yamlPath, "utf8"), "existing content");
    });

    it("skips .env when it already exists", () => {
      const envPath = path.join(tempDir, ".env");
      fs.writeFileSync(envPath, "MY_KEY=value");

      const result = initProjectFiles(tempDir);

      assert.ok(result.created.includes("./llm-comp.yaml"));
      assert.ok(result.skipped.includes("./.env"));
      assert.strictEqual(fs.readFileSync(envPath, "utf8"), "MY_KEY=value");
    });

    it("skips both files when they already exist", () => {
      fs.writeFileSync(path.join(tempDir, "llm-comp.yaml"), "yaml");
      fs.writeFileSync(path.join(tempDir, ".env"), "env");

      const result = initProjectFiles(tempDir);

      assert.deepStrictEqual(result.created, []);
      assert.deepStrictEqual(result.skipped.sort(), ["./.env", "./llm-comp.yaml"].sort());
    });

    it("creates .env with restrictive permissions (0600)", () => {
      initProjectFiles(tempDir);

      const envPath = path.join(tempDir, ".env");
      const stats = fs.statSync(envPath);
      const mode = stats.mode & 0o777;

      // On Unix systems, check for 0600 permissions
      if (process.platform !== "win32") {
        assert.strictEqual(mode, 0o600, ".env should have 0600 permissions");
      }
    });

    it("creates llm-comp.yaml with expected structure", () => {
      initProjectFiles(tempDir);

      const yamlPath = path.join(tempDir, "llm-comp.yaml");
      const content = fs.readFileSync(yamlPath, "utf8");

      assert.ok(content.includes("app:"), "should have app section");
      assert.ok(content.includes("providers:"), "should have providers section");
      assert.ok(content.includes("openai:"), "should have openai provider");
      assert.ok(content.includes("claude:"), "should have claude provider");
      assert.ok(content.includes("gemini:"), "should have gemini provider");
      assert.ok(content.includes("ui:"), "should have ui section");
      assert.ok(content.includes("mode:"), "should have mode setting");
    });

    it("creates .env with expected environment variables", () => {
      initProjectFiles(tempDir);

      const envPath = path.join(tempDir, ".env");
      const content = fs.readFileSync(envPath, "utf8");

      assert.ok(content.includes("OPENAI_API_KEY="), "should have OPENAI_API_KEY");
      assert.ok(content.includes("ANTHROPIC_API_KEY="), "should have ANTHROPIC_API_KEY");
      assert.ok(content.includes("GEMINI_API_KEY="), "should have GEMINI_API_KEY");
    });
  });
});

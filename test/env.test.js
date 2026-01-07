import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { loadDotEnv } from "../dist/env.js";

function withTempDir(fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "llm-comp-test-"));
  try {
    return fn(dir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function withEnv(vars, fn) {
  const previous = {};
  for (const key of Object.keys(vars)) {
    previous[key] = process.env[key];
    const value = vars[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
  try {
    return fn();
  } finally {
    for (const key of Object.keys(previous)) {
      const value = previous[key];
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

test("loadDotEnv parses .env and respects existing env", () => {
  withTempDir((dir) => {
    const envText = [
      "# comment",
      "EXISTING=from_file",
      "EMPTY=",
      "SPACED = spaced value",
      'QUOTED="with spaces"',
      "SINGLE='single value'",
      "EQUALS=foo=bar",
      "NOEQ",
      "",
    ].join("\n");

    fs.writeFileSync(path.join(dir, ".env"), envText, "utf8");

    withEnv(
      {
        EXISTING: "keep",
        EMPTY: undefined,
        SPACED: undefined,
        QUOTED: undefined,
        SINGLE: undefined,
        EQUALS: undefined,
        NOEQ: undefined,
      },
      () => {
        loadDotEnv(dir);

        assert.equal(process.env.EXISTING, "keep");
        assert.equal(process.env.EMPTY, "");
        assert.equal(process.env.SPACED, "spaced value");
        assert.equal(process.env.QUOTED, "with spaces");
        assert.equal(process.env.SINGLE, "single value");
        assert.equal(process.env.EQUALS, "foo=bar");
        assert.equal(process.env.NOEQ, undefined);
      }
    );
  });
});

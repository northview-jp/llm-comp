import assert from "node:assert/strict";
import test from "node:test";

import { stripAnsi, codePointWidth, stringWidth } from "../dist/utils/width.js";

test("stripAnsi removes ANSI color codes", () => {
  const input = "\x1b[31mred\x1b[0m plain \x1b[1mbold\x1b[0m";
  assert.equal(stripAnsi(input), "red plain bold");
});

test("codePointWidth handles zero-width, fullwidth, and normal code points", () => {
  assert.equal(codePointWidth(0x61), 1);
  assert.equal(codePointWidth(0x0301), 0);
  assert.equal(codePointWidth(0x200d), 0);
  assert.equal(codePointWidth(0x3042), 2);
});

test("stringWidth counts ANSI-stripped fullwidth and combining characters", () => {
  const smile = "\u{1F600}";
  const composed = "A\u0301";
  const colored = `\x1b[32m${smile}\x1b[0m`;

  assert.equal(stringWidth(composed), 1);
  assert.equal(stringWidth(smile), 2);
  assert.equal(stringWidth(colored), 2);
  assert.equal(stringWidth(`${smile}A`), 3);
});

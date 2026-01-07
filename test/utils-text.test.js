import assert from "node:assert/strict";
import test from "node:test";

import { wrapText, clamp, padRight, truncate } from "../dist/utils/text.js";

test("wrapText normalizes line endings and enforces minimum width", () => {
  assert.deepEqual(wrapText("alpha\r\nbeta", 20), ["alpha", "beta"]);
  assert.deepEqual(wrapText("1234567890", 1), ["1234567890"]);
});

test("wrapText splits long tokens", () => {
  assert.deepEqual(wrapText("abcdefghijklmno", 8), ["abcdefghij", "klmno"]);
});

test("wrapText and truncate account for wide characters", () => {
  assert.deepEqual(wrapText("あいうえおかきくけこ", 10), ["あいうえお", "かきくけこ"]);
  assert.equal(truncate("あいうえお", 6), "あい\u2026");
});

test("clamp, padRight, and truncate handle edge cases", () => {
  assert.equal(clamp(5, 1, 10), 5);
  assert.equal(clamp(-1, 0, 10), 0);
  assert.equal(clamp(11, 0, 10), 10);

  assert.equal(padRight("abc", 5), "abc  ");
  assert.equal(padRight("abcd", 2), "abcd");
  assert.equal(padRight("あい", 6), "あい  ");

  assert.equal(truncate("abcdef", 0), "");
  assert.equal(truncate("abcdef", 1), "\u2026");
  assert.equal(truncate("abc", 5), "abc");
  assert.equal(truncate("abcdef", 5), "abcd\u2026");
  assert.equal(truncate("\ud83d\ude00\ud83d\ude00\ud83d\ude00", 4), "\ud83d\ude00\u2026");
});

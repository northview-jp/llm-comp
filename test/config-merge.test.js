import assert from "node:assert/strict";
import test from "node:test";

import { clone, isPlainObject, deepMerge } from "../dist/config/merge.js";

test("clone copies nested objects", () => {
  const base = { a: { b: 1 } };
  const copy = clone(base);

  assert.deepEqual(copy, base);
  copy.a.b = 2;
  assert.equal(base.a.b, 1);
});

test("isPlainObject identifies plain objects", () => {
  assert.equal(isPlainObject({}), true);
  assert.equal(isPlainObject([]), false);
  assert.equal(isPlainObject(null), false);
  assert.equal(isPlainObject(() => {}), false);
});

test("deepMerge merges nested objects and ignores undefined", () => {
  const base = { a: 1, b: { c: 2, d: 3 }, list: [1, 2] };
  const patch = { a: 2, b: { d: 4, e: 5 }, list: ["x"], skip: undefined };

  const out = deepMerge(base, patch);

  assert.deepEqual(out, { a: 2, b: { c: 2, d: 4, e: 5 }, list: ["x"] });
});

test("deepMerge ignores blocked keys and avoids prototype pollution", () => {
  const base = { safe: true };
  const patch = JSON.parse('{"__proto__": {"polluted": true}}');

  const out = deepMerge(base, patch);

  assert.equal(out.safe, true);
  assert.equal(out.polluted, undefined);
  assert.equal({}.polluted, undefined);
});

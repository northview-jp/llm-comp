import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { postJson, safeJsonStringify } from "../dist/providers/http.js";

let originalFetch;

beforeEach(() => {
  originalFetch = globalThis.fetch;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("providers/http", () => {
  describe("safeJsonStringify", () => {
    it("stringifies objects with indentation", () => {
      const obj = { key: "value", nested: { a: 1 } };
      const result = safeJsonStringify(obj);
      assert.ok(result.includes('"key": "value"'));
      assert.ok(result.includes('"nested"'));
    });

    it("stringifies arrays", () => {
      const arr = [1, 2, 3];
      const result = safeJsonStringify(arr);
      assert.strictEqual(result, "[\n  1,\n  2,\n  3\n]");
    });

    it("stringifies primitives", () => {
      assert.strictEqual(safeJsonStringify("hello"), '"hello"');
      assert.strictEqual(safeJsonStringify(42), "42");
      assert.strictEqual(safeJsonStringify(true), "true");
      assert.strictEqual(safeJsonStringify(null), "null");
    });

    it("handles undefined", () => {
      assert.strictEqual(safeJsonStringify(undefined), undefined);
    });

    it("handles circular references", () => {
      const obj = { a: 1 };
      obj.self = obj;
      const result = safeJsonStringify(obj);
      assert.strictEqual(result, "[object Object]");
    });

    it("handles BigInt by falling back to String", () => {
      const big = BigInt(9007199254740991);
      const result = safeJsonStringify(big);
      assert.strictEqual(result, "9007199254740991");
    });
  });

  describe("postJson", () => {
    it("sends JSON body and parses successful responses", async () => {
      let seenInit;
      globalThis.fetch = async (_url, init) => {
        seenInit = init;
        return {
          ok: true,
          status: 200,
          text: async () => '{"hello":"world"}',
        };
      };

      const res = await postJson("http://test", { Authorization: "token" }, { a: 1 }, 500);

      assert.equal(res.ok, true);
      assert.equal(res.status, 200);
      assert.deepEqual(res.data, { hello: "world" });
      assert.equal(res.text, '{"hello":"world"}');
      assert.equal(seenInit.method, "POST");
      assert.equal(seenInit.headers["content-type"], "application/json");
      assert.equal(seenInit.headers.Authorization, "token");
      assert.equal(seenInit.body, JSON.stringify({ a: 1 }));
      assert.ok(seenInit.signal);
    });

    it("returns raw text when response is not ok and JSON parsing fails", async () => {
      globalThis.fetch = async () => ({
        ok: false,
        status: 400,
        text: async () => "Bad Request",
      });

      const res = await postJson("http://test", {}, { a: 1 }, 500);

      assert.equal(res.ok, false);
      assert.equal(res.status, 400);
      assert.equal(res.data, undefined);
      assert.equal(res.text, "Bad Request");
    });

    it("marks timeout for AbortError", async () => {
      globalThis.fetch = async () => {
        const err = new Error("aborted");
        err.name = "AbortError";
        throw err;
      };

      const res = await postJson("http://test", {}, {}, 500);

      assert.equal(res.ok, false);
      assert.equal(res.status, 0);
      assert.equal(res.isTimeout, true);
    });

    it("handles non-Error rejections", async () => {
      globalThis.fetch = async () => {
        throw "boom";
      };

      const res = await postJson("http://test", {}, {}, 500);

      assert.equal(res.ok, false);
      assert.equal(res.status, 0);
      assert.equal(res.text, "boom");
    });
  });
});

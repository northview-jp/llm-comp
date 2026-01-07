import assert from "node:assert/strict";
import test from "node:test";
import {
  isProviderSuccess,
  isProviderFailure,
  createDisabledError,
  createApiKeyMissingError,
  createTimeoutError,
} from "../dist/types/provider.js";

test("provider failure helpers build consistent shapes", () => {
  const disabled = createDisabledError("openai");
  assert.equal(disabled.kind, "failure");
  assert.equal(disabled.failureType, "disabled");
  assert.equal(disabled.provider, "openai");
  assert.equal(disabled.message, "Disabled. Set 'enabled: true' in llm-comp.yaml");
  assert.equal(disabled.elapsed_ms, 0);

  const missing = createApiKeyMissingError("claude", "ANTHROPIC_API_KEY", 7);
  assert.equal(missing.failureType, "api_key_missing");
  assert.equal(missing.message, "Missing ANTHROPIC_API_KEY. Add to .env: ANTHROPIC_API_KEY=sk-ant-...");
  assert.equal(missing.elapsed_ms, 7);

  const timeout = createTimeoutError("gemini", "gemini-2.0-flash", 5000, 42);
  assert.equal(timeout.failureType, "timeout");
  assert.equal(timeout.model, "gemini-2.0-flash");
  assert.equal(timeout.message, "Timed out after 5s. Increase app.timeout_ms in config.");
  assert.equal(timeout.elapsed_ms, 42);
});

test("type guards identify success and failure", () => {
  const success = {
    kind: "success",
    provider: "openai",
    model: "gpt-4.1",
    text: "ok",
    elapsed_ms: 10,
  };
  const failure = {
    kind: "failure",
    failureType: "timeout",
    provider: "openai",
    message: "timeout",
    elapsed_ms: 10,
  };

  assert.equal(isProviderSuccess(success), true);
  assert.equal(isProviderFailure(success), false);
  assert.equal(isProviderSuccess(failure), false);
  assert.equal(isProviderFailure(failure), true);
});

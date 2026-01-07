import { ProviderResult, ProviderError } from "../types/index.js";

export function printJson(results: Array<ProviderResult | ProviderError>): void {
  const out = results.map((r) => {
    if ("text" in r) {
      return {
        provider: r.provider,
        model: r.model,
        elapsed_ms: r.elapsed_ms,
        text: r.text,
      };
    }
    return {
      provider: r.provider,
      model: r.model,
      elapsed_ms: r.elapsed_ms,
      error: r.message,
      status: r.status,
    };
  });
  process.stdout.write(JSON.stringify(out, null, 2) + "\n");
}

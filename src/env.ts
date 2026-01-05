import fs from "fs";
import path from "path";

/**
 * Minimal .env loader (alternative to dotenv). Self-implemented to avoid extra dependencies.
 *
 * - Trims leading/trailing whitespace
 * - Parses KEY=VALUE format
 * - Strips surrounding double/single quotes from VALUE
 * - Does not overwrite existing process.env keys (environment variables take precedence)
 */
export function loadDotEnv(cwd: string): void {
  const envPath = path.join(cwd, ".env");
  if (!fs.existsSync(envPath)) return;

  const text = fs.readFileSync(envPath, "utf8");
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const eq = line.indexOf("=");
    if (eq <= 0) continue;

    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();

    // strip quotes
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

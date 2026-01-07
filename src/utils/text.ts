import { codePointWidth, stringWidth } from "./width.js";

function sliceByWidth(str: string, maxWidth: number): [string, string] {
  let width = 0;
  let i = 0;
  while (i < str.length) {
    const codePoint = str.codePointAt(i);
    if (codePoint === undefined) break;
    const charWidth = codePointWidth(codePoint);
    if (width + charWidth > maxWidth) break;
    width += charWidth;
    i += codePoint > 0xffff ? 2 : 1;
  }
  return [str.slice(0, i), str.slice(i)];
}

export function wrapText(text: string, width: number): string[] {
  const out: string[] = [];
  const lines = text.replace(/\r\n/g, "\n").split("\n");

  const w = Math.max(10, width);

  for (const line of lines) {
    if (stringWidth(line) <= w) {
      out.push(line);
      continue;
    }
    // word-wrap (keeps long tokens split)
    let cur = "";
    let curWidth = 0;
    for (const token of line.split(/(\s+)/)) {
      if (!token) continue;
      const tokenWidth = stringWidth(token);
      if (curWidth + tokenWidth <= w) {
        cur += token;
        curWidth += tokenWidth;
      } else {
        if (cur) out.push(cur.replace(/\s+$/g, ""));
        // token itself might be longer than width
        let t = token;
        while (stringWidth(t) > w) {
          const [head, tail] = sliceByWidth(t, w);
          out.push(head);
          t = tail;
        }
        cur = t;
        curWidth = stringWidth(cur);
      }
    }
    if (cur) out.push(cur.replace(/\s+$/g, ""));
  }
  return out;
}

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function padRight(s: string, len: number): string {
  const currentLen = stringWidth(s);
  if (currentLen >= len) return s;
  return s + " ".repeat(len - currentLen);
}

export function truncate(s: string, len: number): string {
  if (len <= 0) return "";
  const visualLen = stringWidth(s);
  if (visualLen <= len) return s;
  if (len <= 1) return "…";

  let result = "";
  let widthCount = 0;
  let i = 0;

  while (i < s.length && widthCount < len - 1) {
    // Check for ANSI escape sequence
    if (s[i] === "\x1b" && s[i + 1] === "[") {
      const end = s.indexOf("m", i);
      if (end !== -1) {
        result += s.slice(i, end + 1);
        i = end + 1;
        continue;
      }
    }
    const codePoint = s.codePointAt(i);
    if (codePoint === undefined) break;
    const charWidth = codePointWidth(codePoint);
    if (widthCount + charWidth > len - 1) break;
    result += String.fromCodePoint(codePoint);
    widthCount += charWidth;
    i += codePoint > 0xffff ? 2 : 1;
  }

  // Append any trailing ANSI reset codes
  while (i < s.length) {
    if (s[i] === "\x1b" && s[i + 1] === "[") {
      const end = s.indexOf("m", i);
      if (end !== -1) {
        const code = s.slice(i, end + 1);
        if (code === "\x1b[0m" || code === "\x1b[m") {
          result += code;
        }
        i = end + 1;
        continue;
      }
    }
    break;
  }

  return result + "…";
}

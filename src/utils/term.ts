import { stringWidth, stripAnsi as stripAnsiWidth } from "./width.js";

export const ANSI = {
  // Screen control
  clear: "\x1b[2J\x1b[H",
  hideCursor: "\x1b[?25l",
  showCursor: "\x1b[?25h",

  // Text styles
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  italic: "\x1b[3m",
  underline: "\x1b[4m",
  blink: "\x1b[5m",
  inverse: "\x1b[7m",
  strikethrough: "\x1b[9m",

  // Foreground colors - standard
  fgBlack: "\x1b[30m",
  fgRed: "\x1b[31m",
  fgGreen: "\x1b[32m",
  fgYellow: "\x1b[33m",
  fgBlue: "\x1b[34m",
  fgMagenta: "\x1b[35m",
  fgCyan: "\x1b[36m",
  fgWhite: "\x1b[37m",
  fgGray: "\x1b[90m",

  // Foreground colors - bright
  fgBrightRed: "\x1b[91m",
  fgBrightGreen: "\x1b[92m",
  fgBrightYellow: "\x1b[93m",
  fgBrightBlue: "\x1b[94m",
  fgBrightMagenta: "\x1b[95m",
  fgBrightCyan: "\x1b[96m",
  fgBrightWhite: "\x1b[97m",

  // Background colors
  bgBlack: "\x1b[40m",
  bgRed: "\x1b[41m",
  bgGreen: "\x1b[42m",
  bgYellow: "\x1b[43m",
  bgBlue: "\x1b[44m",
  bgMagenta: "\x1b[45m",
  bgCyan: "\x1b[46m",
  bgWhite: "\x1b[47m",
  bgGray: "\x1b[100m",
  bgBrightBlack: "\x1b[100m",
};

// 256-color support for richer colors
export function fg256(code: number): string {
  return `\x1b[38;5;${code}m`;
}

export function bg256(code: number): string {
  return `\x1b[48;5;${code}m`;
}

// TrueColor (24-bit) support
export function fgRGB(r: number, g: number, b: number): string {
  return `\x1b[38;2;${r};${g};${b}m`;
}

export function bgRGB(r: number, g: number, b: number): string {
  return `\x1b[48;2;${r};${g};${b}m`;
}

// Rainbow color palettes
export const RAINBOW_COLORS = [
  fgRGB(255, 107, 107),  // Red/Pink
  fgRGB(255, 159, 67),   // Orange
  fgRGB(254, 211, 48),   // Yellow
  fgRGB(38, 222, 129),   // Green
  fgRGB(69, 170, 242),   // Blue
  fgRGB(165, 94, 234),   // Purple
  fgRGB(243, 104, 224),  // Pink
];

export const NEON_COLORS = {
  pink: fgRGB(255, 20, 147),
  cyan: fgRGB(0, 255, 255),
  green: fgRGB(57, 255, 20),
  orange: fgRGB(255, 165, 0),
  purple: fgRGB(191, 0, 255),
  yellow: fgRGB(255, 255, 0),
  blue: fgRGB(30, 144, 255),
};

// Gradient presets for different moods
export const GRADIENTS = {
  sunset: [fgRGB(255, 94, 98), fgRGB(255, 153, 102), fgRGB(255, 206, 84)],
  ocean: [fgRGB(0, 198, 255), fgRGB(0, 114, 255), fgRGB(72, 52, 212)],
  forest: [fgRGB(17, 153, 142), fgRGB(56, 239, 125), fgRGB(167, 255, 131)],
  candy: [fgRGB(255, 110, 199), fgRGB(255, 183, 107), fgRGB(107, 255, 230)],
  fire: [fgRGB(255, 0, 0), fgRGB(255, 154, 0), fgRGB(255, 206, 0)],
  neon: [fgRGB(255, 0, 128), fgRGB(0, 255, 255), fgRGB(128, 0, 255)],
};

// Unicode box drawing characters
export const BOX = {
  // Single line
  topLeft: "┌",
  topRight: "┐",
  bottomLeft: "└",
  bottomRight: "┘",
  horizontal: "─",
  vertical: "│",
  teeRight: "├",
  teeLeft: "┤",
  teeDown: "┬",
  teeUp: "┴",
  cross: "┼",

  // Double line
  dTopLeft: "╔",
  dTopRight: "╗",
  dBottomLeft: "╚",
  dBottomRight: "╝",
  dHorizontal: "═",
  dVertical: "║",

  // Rounded corners
  rTopLeft: "╭",
  rTopRight: "╮",
  rBottomLeft: "╰",
  rBottomRight: "╯",

  // Heavy
  hTopLeft: "┏",
  hTopRight: "┓",
  hBottomLeft: "┗",
  hBottomRight: "┛",
  hHorizontal: "━",
  hVertical: "┃",
};

// UI symbols
export const SYMBOLS = {
  // Checkboxes & Radio
  checkboxOn: "☑",
  checkboxOff: "☐",
  radioOn: "◉",
  radioOff: "○",
  checkmark: "✔",
  cross: "✘",

  // Arrows and pointers
  arrowRight: "→",
  arrowLeft: "←",
  arrowUp: "↑",
  arrowDown: "↓",
  arrowBoth: "↕",
  pointer: "❯",
  pointerSmall: "›",
  pointerDouble: "»",
  triangleRight: "▸",
  triangleDown: "▾",
  triangleUp: "▴",
  triangleLeft: "◂",

  // Status & indicators
  bullet: "•",
  circle: "●",
  circleEmpty: "○",
  diamond: "◆",
  diamondEmpty: "◇",
  star: "★",
  starEmpty: "☆",
  heart: "♥",
  info: "ℹ",
  warning: "⚠",
  lightning: "⚡",
  fire: "🔥",

  // Progress bars
  progressFull: "█",
  progressMedium: "▓",
  progressLight: "░",
  progressLeft: "▐",
  progressRight: "▌",

  // Blocks for gradient
  block8: "█",
  block7: "▇",
  block6: "▆",
  block5: "▅",
  block4: "▄",
  block3: "▃",
  block2: "▂",
  block1: "▁",

  // Misc
  ellipsis: "…",
  middleDot: "·",
  pipe: "│",
  dash: "—",
  tick: "✓",
};

// Spinner frames - multiple styles
export const SPINNERS = {
  dots: ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"],
  line: ["─", "\\", "│", "/"],
  arc: ["◜", "◠", "◝", "◞", "◡", "◟"],
  bounce: ["⠁", "⠂", "⠄", "⠂"],
  pulse: ["◐", "◓", "◑", "◒"],
  wave: ["▁", "▂", "▃", "▄", "▅", "▆", "▇", "█", "▇", "▆", "▅", "▄", "▃", "▂"],
  star: ["✶", "✸", "✹", "✺", "✹", "✸"],
  moon: ["🌑", "🌒", "🌓", "🌔", "🌕", "🌖", "🌗", "🌘"],
  clock: ["🕐", "🕑", "🕒", "🕓", "🕔", "🕕", "🕖", "🕗", "🕘", "🕙", "🕚", "🕛"],
  sparkle: ["✨", "💫", "⭐", "🌟", "💫", "✨"],
  hearts: ["💜", "💙", "💚", "💛", "🧡", "❤️", "🧡", "💛", "💚", "💙"],
  dots3: ["⠋", "⠙", "⠚", "⠒", "⠂", "⠂", "⠒", "⠲", "⠴", "⠦", "⠖", "⠒", "⠐", "⠐", "⠒", "⠓", "⠋"],
};

export const SPINNER_FRAMES = SPINNERS.dots;

// Rainbow animated spinner (returns colored frame based on index)
export function rainbowSpinner(frameIdx: number): string {
  const frames = SPINNERS.dots;
  const frame = frames[frameIdx % frames.length];
  const color = RAINBOW_COLORS[frameIdx % RAINBOW_COLORS.length];
  return `${color}${frame}${ANSI.reset}`;
}

// Pulsing text effect
export function pulseText(text: string, frameIdx: number): string {
  const intensity = Math.sin(frameIdx * 0.3) * 0.5 + 0.5;
  const r = Math.floor(255 * intensity);
  const g = Math.floor(200 * intensity);
  const b = Math.floor(255 * intensity);
  return `${fgRGB(r, g, b)}${text}${ANSI.reset}`;
}

// Provider configuration with vibrant neon colors
export const PROVIDERS = {
  openai: {
    name: "OpenAI",
    color: fgRGB(16, 185, 129),      // Emerald green
    icon: "●",
    bgColor: bgRGB(6, 78, 59),
    accentColor: fgRGB(52, 211, 153),
  },
  claude: {
    name: "Claude",
    color: fgRGB(251, 146, 60),      // Warm orange
    icon: "●",
    bgColor: bgRGB(124, 45, 18),
    accentColor: fgRGB(253, 186, 116),
  },
  gemini: {
    name: "Gemini",
    color: fgRGB(96, 165, 250),      // Sky blue
    icon: "●",
    bgColor: bgRGB(30, 64, 175),
    accentColor: fgRGB(147, 197, 253),
  },
};

export const PROVIDER_COLORS = {
  openai: fgRGB(16, 185, 129),
  claude: fgRGB(251, 146, 60),
  gemini: fgRGB(96, 165, 250),
};

export const UI_COLORS = {
  success: fgRGB(74, 222, 128),
  error: fgRGB(248, 113, 113),
  warning: fgRGB(250, 204, 21),
  info: fgRGB(56, 189, 248),
  muted: fgRGB(148, 163, 184),
  mutedDark: fgRGB(100, 116, 139),
  text: fgRGB(248, 250, 252),
  textSecondary: fgRGB(226, 232, 240),
  textTertiary: fgRGB(203, 213, 225),
  border: fgRGB(71, 85, 105),
  accent1: fgRGB(139, 92, 246),
  accent2: fgRGB(236, 72, 153),
  accent3: fgRGB(168, 85, 247),
} as const;

export const UI_BG_COLORS = {
  active: bgRGB(51, 65, 85),
} as const;

// Utility functions for rendering
export function stripAnsi(str: string): string {
  return stripAnsiWidth(str);
}

export function visualLength(str: string): number {
  return stringWidth(str);
}

export function padEnd(str: string, len: number, char = " "): string {
  const currentLen = visualLength(str);
  if (currentLen >= len) return str;
  return str + char.repeat(len - currentLen);
}

export function padStart(str: string, len: number, char = " "): string {
  const currentLen = visualLength(str);
  if (currentLen >= len) return str;
  return char.repeat(len - currentLen) + str;
}

export function center(str: string, width: number, char = " "): string {
  const len = visualLength(str);
  if (len >= width) return str;
  const left = Math.floor((width - len) / 2);
  const right = width - len - left;
  return char.repeat(left) + str + char.repeat(right);
}

// Progress bar renderer
export function progressBar(
  progress: number,
  width: number,
  opts: {
    filled?: string;
    empty?: string;
    showPercent?: boolean;
    color?: string;
  } = {}
): string {
  const { filled = "━", empty = "─", showPercent = false, color = ANSI.fgBrightCyan } = opts;
  const pct = Math.max(0, Math.min(1, progress));
  const filledLen = Math.round(pct * width);
  const emptyLen = width - filledLen;

  let bar = `${color}${filled.repeat(filledLen)}${ANSI.reset}${ANSI.fgGray}${empty.repeat(emptyLen)}${ANSI.reset}`;

  if (showPercent) {
    bar += ` ${ANSI.fgGray}${Math.round(pct * 100)}%${ANSI.reset}`;
  }

  return bar;
}

// Animated progress indicator
export function waveProgress(frame: number, width: number): string {
  const wave = SPINNERS.wave;
  const chars: string[] = [];
  for (let i = 0; i < width; i++) {
    const idx = (frame + i) % wave.length;
    chars.push(`${ANSI.fgBrightCyan}${wave[idx]}${ANSI.reset}`);
  }
  return chars.join("");
}

// Box drawing helpers
export function boxTop(width: number, title?: string): string {
  if (!title) {
    return `${ANSI.fgGray}${BOX.rTopLeft}${BOX.horizontal.repeat(width - 2)}${BOX.rTopRight}${ANSI.reset}`;
  }
  const titleLen = visualLength(title);
  const leftPad = 2;
  const rightPad = Math.max(0, width - 4 - titleLen - leftPad);
  return `${ANSI.fgGray}${BOX.rTopLeft}${BOX.horizontal.repeat(leftPad)}${ANSI.reset} ${title} ${ANSI.fgGray}${BOX.horizontal.repeat(rightPad)}${BOX.rTopRight}${ANSI.reset}`;
}

export function boxBottom(width: number): string {
  return `${ANSI.fgGray}${BOX.rBottomLeft}${BOX.horizontal.repeat(width - 2)}${BOX.rBottomRight}${ANSI.reset}`;
}

export function boxLine(content: string, width: number): string {
  const contentLen = visualLength(content);
  const padding = Math.max(0, width - 4 - contentLen);
  return `${ANSI.fgGray}${BOX.vertical}${ANSI.reset} ${content}${" ".repeat(padding)} ${ANSI.fgGray}${BOX.vertical}${ANSI.reset}`;
}

export function boxEmpty(width: number): string {
  return `${ANSI.fgGray}${BOX.vertical}${ANSI.reset}${" ".repeat(width - 2)}${ANSI.fgGray}${BOX.vertical}${ANSI.reset}`;
}

export function boxSeparator(width: number): string {
  return `${ANSI.fgGray}${BOX.teeRight}${BOX.horizontal.repeat(width - 2)}${BOX.teeLeft}${ANSI.reset}`;
}

// Gradient text (simple version using color transitions)
export function gradientText(text: string, colors: string[]): string {
  if (colors.length === 0) return text;
  if (colors.length === 1) return `${colors[0]}${text}${ANSI.reset}`;

  const chars = [...text];
  const result: string[] = [];
  for (let i = 0; i < chars.length; i++) {
    const colorIdx = Math.floor((i / chars.length) * colors.length);
    result.push(`${colors[colorIdx]}${chars[i]}`);
  }
  return result.join("") + ANSI.reset;
}

// Rainbow text effect
export function rainbowText(text: string, offset = 0): string {
  const chars = [...text];
  const result: string[] = [];
  for (let i = 0; i < chars.length; i++) {
    if (chars[i] === " ") {
      result.push(" ");
    } else {
      const colorIdx = (i + offset) % RAINBOW_COLORS.length;
      result.push(`${RAINBOW_COLORS[colorIdx]}${chars[i]}`);
    }
  }
  return result.join("") + ANSI.reset;
}

// Animated rainbow text (use with frame counter)
export function animatedRainbowText(text: string, frame: number): string {
  return rainbowText(text, frame);
}

// Sparkle effect around text
export function sparkleText(text: string): string {
  const sparkles = ["✨", "💫", "⭐", "✧", "★"];
  const s1 = sparkles[Math.floor(Math.random() * sparkles.length)];
  const s2 = sparkles[Math.floor(Math.random() * sparkles.length)];
  return `${s1} ${text} ${s2}`;
}

// Colorful box borders
export function colorfulBoxTop(width: number, title?: string, color?: string): string {
  const c = color || NEON_COLORS.cyan;
  if (!title) {
    return `${c}${BOX.rTopLeft}${BOX.horizontal.repeat(width - 2)}${BOX.rTopRight}${ANSI.reset}`;
  }
  const titleLen = visualLength(title);
  const leftPad = 2;
  const rightPad = Math.max(0, width - 4 - titleLen - leftPad);
  return `${c}${BOX.rTopLeft}${BOX.horizontal.repeat(leftPad)}${ANSI.reset} ${title} ${c}${BOX.horizontal.repeat(rightPad)}${BOX.rTopRight}${ANSI.reset}`;
}

export function colorfulBoxBottom(width: number, color?: string): string {
  const c = color || NEON_COLORS.cyan;
  return `${c}${BOX.rBottomLeft}${BOX.horizontal.repeat(width - 2)}${BOX.rBottomRight}${ANSI.reset}`;
}

export function colorfulBoxSide(color?: string): string {
  const c = color || NEON_COLORS.cyan;
  return `${c}${BOX.vertical}${ANSI.reset}`;
}

// Rainbow gradient border (animated)
export function rainbowBorder(width: number, frame: number, type: "top" | "bottom" | "mid" = "top"): string {
  const corners = {
    top: [BOX.rTopLeft, BOX.rTopRight],
    bottom: [BOX.rBottomLeft, BOX.rBottomRight],
    mid: [BOX.teeRight, BOX.teeLeft],
  };
  const [left, right] = corners[type];
  const chars: string[] = [];

  chars.push(`${RAINBOW_COLORS[frame % RAINBOW_COLORS.length]}${left}`);
  for (let i = 0; i < width - 2; i++) {
    const colorIdx = (i + frame) % RAINBOW_COLORS.length;
    chars.push(`${RAINBOW_COLORS[colorIdx]}${BOX.horizontal}`);
  }
  chars.push(`${RAINBOW_COLORS[(width + frame) % RAINBOW_COLORS.length]}${right}${ANSI.reset}`);

  return chars.join("");
}

// Status badge
export function badge(text: string, color: string, bgColor?: string): string {
  const bg = bgColor || "";
  return `${bg}${color}${ANSI.bold} ${text} ${ANSI.reset}`;
}

// Key hint formatting
export function keyHint(key: string, description: string): string {
  return `${ANSI.fgBrightWhite}${ANSI.bold}${key}${ANSI.reset} ${ANSI.fgGray}${description}${ANSI.reset}`;
}

export type Key =
  | "tab"
  | "shiftTab"
  | "left"
  | "right"
  | "up"
  | "down"
  | "pageUp"
  | "pageDown"
  | "home"
  | "end"
  | "esc"
  | "q"
  | "ctrlC"
  | "enter"
  | "space"
  | "1"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "h"
  | "?"
  | "c"
  | "y"
  | "n"
  | "unknown";

export function decodeKey(buf: Buffer): Key {
  const s = buf.toString("utf8");

  if (s === "\x03") return "ctrlC";
  if (s === "\x1b") return "esc";
  if (s === "\t") return "tab";
  if (s === "\x1b[Z") return "shiftTab";
  if (s === "\x1b[A") return "up";
  if (s === "\x1b[B") return "down";
  if (s === "\x1b[C") return "right";
  if (s === "\x1b[D") return "left";
  if (s === "\x1b[5~") return "pageUp";
  if (s === "\x1b[6~") return "pageDown";
  if (s === "\x1b[H" || s === "\x1bOH") return "home";
  if (s === "\x1b[F" || s === "\x1bOF") return "end";
  if (s === "q" || s === "Q") return "q";
  if (s === "\r" || s === "\n") return "enter";
  if (s >= "1" && s <= "9") return s as Key;
  if (s === "h" || s === "H") return "h";
  if (s === "?") return "?";
  if (s === "c" || s === "C") return "c";
  if (s === " ") return "space";
  if (s === "y" || s === "Y") return "y";
  if (s === "n" || s === "N") return "n";

  return "unknown";
}

import assert from "node:assert/strict";
import test from "node:test";
import {
  ANSI,
  BOX,
  NEON_COLORS,
  RAINBOW_COLORS,
  SPINNERS,
  animatedRainbowText,
  badge,
  bg256,
  bgRGB,
  boxBottom,
  boxEmpty,
  boxLine,
  boxSeparator,
  boxTop,
  colorfulBoxBottom,
  colorfulBoxSide,
  colorfulBoxTop,
  stripAnsi,
  fg256,
  fgRGB,
  gradientText,
  keyHint,
  pulseText,
  rainbowBorder,
  rainbowSpinner,
  rainbowText,
  visualLength,
  padEnd,
  padStart,
  center,
  progressBar,
  sparkleText,
  decodeKey,
  waveProgress,
} from "../dist/utils/term.js";

test("stripAnsi and visualLength remove control codes", () => {
  const colored = `${ANSI.fgRed}hi${ANSI.reset}`;
  assert.equal(stripAnsi(colored), "hi");
  assert.equal(visualLength(colored), 2);
  assert.equal(visualLength("あい"), 4);
  assert.equal(visualLength("\ud83d\ude00"), 2);
});

test("pad helpers respect visual width", () => {
  const colored = `${ANSI.fgRed}hi${ANSI.reset}`;
  assert.equal(stripAnsi(padEnd(colored, 4, ".")), "hi..");
  assert.equal(stripAnsi(padStart(colored, 4, ".")), "..hi");
  assert.equal(stripAnsi(center("hi", 5, ".")), ".hi..");
});

test("progressBar clamps values and decodeKey maps input", () => {
  const bar = progressBar(1.5, 4, { filled: "#", empty: ".", color: "" });
  assert.equal(stripAnsi(bar), "####");

  const barWithPercent = progressBar(0.25, 8, {
    filled: "#",
    empty: ".",
    color: "",
    showPercent: true,
  });
  assert.equal(stripAnsi(barWithPercent), "##...... 25%");

  assert.equal(decodeKey(Buffer.from("\x03")), "ctrlC");
  assert.equal(decodeKey(Buffer.from("\x1b[B")), "down");
  assert.equal(decodeKey(Buffer.from("5")), "5");
  assert.equal(decodeKey(Buffer.from("x")), "unknown");
});

test("color helpers format ANSI sequences", () => {
  assert.equal(fg256(200), "\x1b[38;5;200m");
  assert.equal(bg256(50), "\x1b[48;5;50m");
  assert.equal(fgRGB(1, 2, 3), "\x1b[38;2;1;2;3m");
  assert.equal(bgRGB(4, 5, 6), "\x1b[48;2;4;5;6m");
});

test("rainbowSpinner and pulseText apply colors", () => {
  const spinner = rainbowSpinner(0);
  assert.ok(spinner.includes(RAINBOW_COLORS[0]));
  assert.ok(spinner.includes(SPINNERS.dots[0]));
  assert.ok(spinner.endsWith(ANSI.reset));

  const pulse = pulseText("hi", 0);
  assert.equal(pulse, `${fgRGB(127, 100, 127)}hi${ANSI.reset}`);
  assert.equal(stripAnsi(pulse), "hi");
});

test("waveProgress renders frame sequence", () => {
  const out = waveProgress(1, 4);
  assert.equal(stripAnsi(out), SPINNERS.wave.slice(1, 5).join(""));
});

test("box helpers render expected borders", () => {
  assert.equal(stripAnsi(boxTop(6)), `${BOX.rTopLeft}${BOX.horizontal.repeat(4)}${BOX.rTopRight}`);
  assert.equal(stripAnsi(boxTop(10, "Hi")), `${BOX.rTopLeft}${BOX.horizontal.repeat(2)} Hi ${BOX.horizontal.repeat(2)}${BOX.rTopRight}`);
  assert.equal(stripAnsi(boxBottom(6)), `${BOX.rBottomLeft}${BOX.horizontal.repeat(4)}${BOX.rBottomRight}`);
  assert.equal(stripAnsi(boxLine("hi", 6)), `${BOX.vertical} hi ${BOX.vertical}`);
  assert.equal(stripAnsi(boxEmpty(6)), `${BOX.vertical}${" ".repeat(4)}${BOX.vertical}`);
  assert.equal(stripAnsi(boxSeparator(6)), `${BOX.teeRight}${BOX.horizontal.repeat(4)}${BOX.teeLeft}`);
});

test("gradientText handles empty and multi-color cases", () => {
  assert.equal(gradientText("hi", []), "hi");
  assert.equal(gradientText("hi", [ANSI.fgRed]), `${ANSI.fgRed}hi${ANSI.reset}`);

  const multi = gradientText("abcd", [ANSI.fgRed, ANSI.fgGreen]);
  assert.equal(stripAnsi(multi), "abcd");
  assert.ok(multi.includes(`${ANSI.fgRed}a`));
  assert.ok(multi.includes(`${ANSI.fgGreen}c`));
  assert.ok(multi.endsWith(ANSI.reset));
});

test("rainbowText preserves spaces and supports offsets", () => {
  const output = rainbowText("a b", 0);
  assert.equal(stripAnsi(output), "a b");
  assert.ok(output.includes(`${RAINBOW_COLORS[0]}a`));
  assert.ok(output.includes(`${RAINBOW_COLORS[2]}b`));

  const offset = rainbowText("ab", 1);
  assert.ok(offset.startsWith(`${RAINBOW_COLORS[1]}a`));
});

test("animatedRainbowText delegates to rainbowText", () => {
  assert.equal(animatedRainbowText("ab", 3), rainbowText("ab", 3));
});

test("sparkleText uses deterministic sparkles with stubbed random", () => {
  const originalRandom = Math.random;
  Math.random = () => 0;
  try {
    assert.equal(sparkleText("hi"), "✨ hi ✨");
  } finally {
    Math.random = originalRandom;
  }
});

test("colorful box helpers and rainbowBorder render expected shapes", () => {
  const top = colorfulBoxTop(6, "Hi", ANSI.fgRed);
  assert.ok(top.startsWith(ANSI.fgRed));
  assert.equal(stripAnsi(top), `${BOX.rTopLeft}${BOX.horizontal.repeat(2)} Hi ${BOX.rTopRight}`);

  const bottom = colorfulBoxBottom(6, NEON_COLORS.cyan);
  assert.equal(stripAnsi(bottom), `${BOX.rBottomLeft}${BOX.horizontal.repeat(4)}${BOX.rBottomRight}`);

  const side = colorfulBoxSide();
  assert.equal(stripAnsi(side), BOX.vertical);

  const border = rainbowBorder(4, 1, "mid");
  assert.ok(border.endsWith(ANSI.reset));
  assert.equal(stripAnsi(border), `${BOX.teeRight}${BOX.horizontal.repeat(2)}${BOX.teeLeft}`);
});

test("badge, keyHint, and decodeKey handle formatting and keys", () => {
  const badged = badge("OK", ANSI.fgGreen, ANSI.bgBlack);
  assert.equal(stripAnsi(badged), " OK ");
  assert.ok(badged.includes(ANSI.bold));

  assert.equal(stripAnsi(keyHint("K", "Help")), "K Help");

  assert.equal(decodeKey(Buffer.from("\x1b")), "esc");
  assert.equal(decodeKey(Buffer.from("\t")), "tab");
  assert.equal(decodeKey(Buffer.from("\x1b[Z")), "shiftTab");
  assert.equal(decodeKey(Buffer.from("\x1b[C")), "right");
  assert.equal(decodeKey(Buffer.from("\x1b[D")), "left");
  assert.equal(decodeKey(Buffer.from("\x1b[5~")), "pageUp");
  assert.equal(decodeKey(Buffer.from("\x1b[6~")), "pageDown");
  assert.equal(decodeKey(Buffer.from("\x1b[H")), "home");
  assert.equal(decodeKey(Buffer.from("\x1bOF")), "end");
  assert.equal(decodeKey(Buffer.from(" ")), "space");
  assert.equal(decodeKey(Buffer.from("Q")), "q");
  assert.equal(decodeKey(Buffer.from("H")), "h");
  assert.equal(decodeKey(Buffer.from("C")), "c");
  assert.equal(decodeKey(Buffer.from("Y")), "y");
  assert.equal(decodeKey(Buffer.from("N")), "n");
  assert.equal(decodeKey(Buffer.from("\n")), "enter");
});

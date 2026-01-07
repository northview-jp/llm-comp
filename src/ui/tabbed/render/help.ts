import {
  ANSI,
  BOX,
  visualLength,
  rainbowText,
  UI_COLORS,
  UI_BG_COLORS,
} from "../../../utils/term.js";
import { truncate } from "../../../utils/text.js";

function helpBoxLine(content: string, innerWidth: number, leftColor: string, rightColor: string): string {
  const contentLen = visualLength(content);
  const padding = Math.max(0, innerWidth - contentLen);
  return `${leftColor}${BOX.vertical}${ANSI.reset} ${content}${" ".repeat(padding)} ${rightColor}${BOX.vertical}${ANSI.reset}`;
}

export function renderHelpScreen(width: number, height: number, isFullscreen: boolean): string {
  const lines: string[] = [];
  const boxWidth = Math.min(56, width - 4);
  const innerWidth = boxWidth - 4;

  lines.push("");

  const titleText = "Keyboard Shortcuts";
  const title = `${UI_COLORS.accent1}✦${ANSI.reset} ${ANSI.bold}${rainbowText(titleText)}${ANSI.reset} ${UI_COLORS.accent2}✦${ANSI.reset}`;
  const titleLen = visualLength(title);
  const titlePad = Math.floor((boxWidth - titleLen) / 2);
  lines.push(" ".repeat(Math.max(2, titlePad)) + title);

  lines.push("");

  const borderColor = UI_COLORS.border;
  const cornerColor1 = UI_COLORS.accent1;
  const cornerColor2 = UI_COLORS.accent2;
  lines.push(`  ${cornerColor1}${BOX.rTopLeft}${borderColor}${BOX.horizontal.repeat(innerWidth + 2)}${cornerColor2}${BOX.rTopRight}${ANSI.reset}`);

  const navHeader = `${UI_COLORS.warning}${ANSI.bold}Navigation${ANSI.reset}`;
  lines.push(`  ${helpBoxLine(navHeader, innerWidth, cornerColor1, cornerColor2)}`);
  lines.push(`  ${cornerColor1}${BOX.teeRight}${borderColor}${BOX.horizontal.repeat(innerWidth + 2)}${cornerColor2}${BOX.teeLeft}${ANSI.reset}`);

  const navItems = [
    [`${UI_BG_COLORS.active}${UI_COLORS.text} Tab ${ANSI.reset} / ${UI_COLORS.text}←→${ANSI.reset}`, "Switch provider"],
    [`${UI_COLORS.text}1-4${ANSI.reset}`, isFullscreen ? "Switch panel / return" : "View full response"],
  ];

  if (isFullscreen) {
    navItems.push([`${UI_BG_COLORS.active}${UI_COLORS.text} Esc ${ANSI.reset} / ${UI_BG_COLORS.active}${UI_COLORS.text} Enter ${ANSI.reset}`, "Return to grid"]);
  }

  for (const [key, desc] of navItems) {
    const rowContent = `${key}  ${UI_COLORS.muted}${desc}${ANSI.reset}`;
    lines.push(`  ${helpBoxLine(rowContent, innerWidth, cornerColor1, cornerColor2)}`);
  }

  if (isFullscreen) {
    lines.push(`  ${cornerColor1}${BOX.teeRight}${borderColor}${BOX.horizontal.repeat(innerWidth + 2)}${cornerColor2}${BOX.teeLeft}${ANSI.reset}`);

    const scrollHeader = `${UI_COLORS.info}${ANSI.bold}Scrolling${ANSI.reset}`;
    lines.push(`  ${helpBoxLine(scrollHeader, innerWidth, cornerColor1, cornerColor2)}`);
    lines.push(`  ${cornerColor1}${BOX.teeRight}${borderColor}${BOX.horizontal.repeat(innerWidth + 2)}${cornerColor2}${BOX.teeLeft}${ANSI.reset}`);

    const scrollItems = [
      [`${UI_COLORS.text}↑${ANSI.reset} / ${UI_COLORS.text}↓${ANSI.reset}`, "Scroll line"],
      [`${UI_COLORS.text}PgUp${ANSI.reset} / ${UI_COLORS.text}PgDn${ANSI.reset}`, "Scroll page"],
      [`${UI_COLORS.text}Home${ANSI.reset} / ${UI_COLORS.text}End${ANSI.reset}`, "Jump to start/end"],
    ];

    for (const [key, desc] of scrollItems) {
      const rowContent = `${key}  ${UI_COLORS.muted}${desc}${ANSI.reset}`;
      lines.push(`  ${helpBoxLine(rowContent, innerWidth, cornerColor1, cornerColor2)}`);
    }
  }

  lines.push(`  ${cornerColor1}${BOX.teeRight}${borderColor}${BOX.horizontal.repeat(innerWidth + 2)}${cornerColor2}${BOX.teeLeft}${ANSI.reset}`);

  const actionsHeader = `${UI_COLORS.success}${ANSI.bold}Actions${ANSI.reset}`;
  lines.push(`  ${helpBoxLine(actionsHeader, innerWidth, cornerColor1, cornerColor2)}`);
  lines.push(`  ${cornerColor1}${BOX.teeRight}${borderColor}${BOX.horizontal.repeat(innerWidth + 2)}${cornerColor2}${BOX.teeLeft}${ANSI.reset}`);

  const actionItems = [
    [`${UI_BG_COLORS.active}${UI_COLORS.text} C ${ANSI.reset}`, "Copy to clipboard"],
    [`${UI_BG_COLORS.active}${UI_COLORS.text} Q ${ANSI.reset} / ${UI_COLORS.text}Ctrl+C${ANSI.reset}`, "Quit"],
    [`${UI_BG_COLORS.active}${UI_COLORS.text} ? ${ANSI.reset} / ${UI_COLORS.text}H${ANSI.reset}`, "Toggle help"],
  ];

  for (const [key, desc] of actionItems) {
    const rowContent = `${key}  ${UI_COLORS.muted}${desc}${ANSI.reset}`;
    lines.push(`  ${helpBoxLine(rowContent, innerWidth, cornerColor1, cornerColor2)}`);
  }

  lines.push(`  ${cornerColor1}${BOX.rBottomLeft}${borderColor}${BOX.horizontal.repeat(innerWidth + 2)}${cornerColor2}${BOX.rBottomRight}${ANSI.reset}`);

  lines.push("");
  const closeHint = `${UI_COLORS.muted}Press any key to close${ANSI.reset}`;
  const closeLen = visualLength(closeHint);
  const closePad = Math.floor((boxWidth - closeLen) / 2);
  lines.push(" ".repeat(Math.max(2, closePad)) + closeHint);

  const availableHeight = Math.max(5, height - 4);
  while (lines.length < availableHeight) lines.push("");
  return "\x1b[2J\x1b[H" + lines.map((l) => truncate(l, width)).join("\n");
}

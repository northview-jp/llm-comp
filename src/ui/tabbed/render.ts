import {
  ANSI,
  BOX,
  SYMBOLS,
  PROVIDERS,
  visualLength,
  rainbowText,
  rainbowSpinner,
  RAINBOW_COLORS,
  UI_COLORS,
  UI_BG_COLORS,
} from "../../utils/term.js";
import { truncate, wrapText } from "../../utils/text.js";
import { ProviderId, ProviderStatus, ProviderState, TabInfo, ProviderGroup } from "../../types/index.js";
import {
  DEFAULT_TERMINAL_WIDTH,
  DEFAULT_TERMINAL_HEIGHT,
  SPINNER_INTERVAL_MS,
} from "../../constants.js";
import { RenderContext, StatusCounts, ScrollInfo } from "./render/types.js";

export { SPINNER_INTERVAL_MS };
export { RenderContext, StatusCounts, ScrollInfo };
export { renderHelpScreen } from "./render/help.js";

function getProvider(providerId: ProviderId) {
  return PROVIDERS[providerId] || { name: providerId, color: ANSI.fgWhite, icon: "◈" };
}

export function statusIcon(s: ProviderStatus | undefined, spinnerIndex: number): string {
  switch (s) {
    case "loading":
      return rainbowSpinner(spinnerIndex);
    case "done":
      return `${UI_COLORS.success}✔${ANSI.reset}`;
    case "error":
      return `${UI_COLORS.error}✘${ANSI.reset}`;
    case "skipped":
      return `${UI_COLORS.muted}○${ANSI.reset}`;
    default:
      return `${UI_COLORS.muted}○${ANSI.reset}`;
  }
}

export function renderPanelHeader(
  panelNum: number,
  label: string,
  status: ProviderStatus | undefined,
  spinnerIdx: number,
  maxWidth: number,
  charCount?: number,
  elapsedMs?: number
): string {
  const headerIcon = statusIcon(status, spinnerIdx);
  const panelColor = RAINBOW_COLORS[panelNum % RAINBOW_COLORS.length];

  let countDisplay = "";
  if (charCount !== undefined && charCount > 0) {
    const formatted = charCount >= 1000
      ? `${(charCount / 1000).toFixed(1)}k`
      : `${charCount}`;
    countDisplay = ` ${UI_COLORS.muted}(${formatted} chars)${ANSI.reset}`;
  }

  let timeDisplay = "";
  if (elapsedMs !== undefined) {
    const secs = elapsedMs / 1000;
    let timeColor = ANSI.fgBrightGreen;
    if (secs > 10) timeColor = ANSI.fgBrightYellow;
    if (secs > 30) timeColor = ANSI.fgBrightRed;
    timeDisplay = ` ${timeColor}${secs.toFixed(2)}s${ANSI.reset}`;
  }

  const labelMaxWidth = maxWidth - 8 - (countDisplay ? visualLength(countDisplay) : 0) - (timeDisplay ? visualLength(timeDisplay) : 0);
  return `${panelColor}[${panelNum}]${ANSI.reset} ${headerIcon} ${ANSI.bold}${UI_COLORS.text}${truncate(label, labelMaxWidth)}${ANSI.reset}${countDisplay}${timeDisplay}`;
}

export function getContentLines(state: ProviderState & { startedAt?: number }, width: number): string[] {
  if (state.status === "loading" || state.status === "idle") {
    let elapsed = "";
    if (state.startedAt) {
      const secs = ((Date.now() - state.startedAt) / 1000).toFixed(1);
      elapsed = ` ${ANSI.fgGray}(${secs}s)${ANSI.reset}`;
    }
    return ["", `  ${ANSI.fgBrightYellow}${SYMBOLS.bullet}${ANSI.reset} ${ANSI.fgGray}Waiting for response${elapsed}${ANSI.reset}`, ""];
  }
  if (state.status === "error") {
    return [
      "",
      `  ${ANSI.fgBrightRed}${ANSI.bold}${SYMBOLS.cross} Error${ANSI.reset}`,
      "",
      ...wrapText(state.error, width - 4).map((l) => `  ${ANSI.fgRed}${l}${ANSI.reset}`),
    ];
  }
  if (state.status === "skipped") {
    return [
      "",
      `  ${ANSI.fgGray}${SYMBOLS.bullet} Skipped${ANSI.reset}`,
      "",
      ...wrapText(state.error, width - 4).map((l) => `  ${ANSI.fgGray}${l}${ANSI.reset}`),
    ];
  }
  return wrapText(state.text ?? "", width);
}


function countStatus(
  tabs: readonly TabInfo[],
  states: Map<string, ProviderState & { startedAt?: number }>
): StatusCounts {
  let done = 0;
  let loading = 0;
  let error = 0;
  for (const tab of tabs) {
    const st = states.get(tab.id);
    if (!st) continue;
    if (st.status === "done") done++;
    else if (st.status === "loading" || st.status === "idle") loading++;
    else if (st.status === "error") error++;
  }
  return { done, loading, error };
}

export function renderHeader(ctx: RenderContext, width: number): string[] {
  const lines: string[] = [];

  // Rainbow gradient title
  const titleContent = `${ANSI.bold}${rainbowText(ctx.title, ctx.spinnerIdx)}${ANSI.reset}`;

  // Status summary with vibrant colors
  const allTabs = ctx.providerGroups.flatMap((g) => g.tabs);
  const { done: doneCount, loading: loadingCount, error: errorCount } = countStatus(allTabs, ctx.states);

  let statusSummary = "";
  if (loadingCount > 0) {
    statusSummary = `${rainbowSpinner(ctx.spinnerIdx)} ${UI_COLORS.warning}${loadingCount} loading${ANSI.reset}`;
  } else if (errorCount > 0 && doneCount > 0) {
    statusSummary = `${UI_COLORS.success}✔ ${doneCount}${ANSI.reset} ${UI_COLORS.error}✘ ${errorCount}${ANSI.reset}`;
  } else if (doneCount > 0) {
    statusSummary = `${UI_COLORS.success}✨ All complete!${ANSI.reset}`;
  }

  const helpHint = `${UI_COLORS.muted}Tab ${UI_COLORS.mutedDark}switch${ANSI.reset}  ${UI_COLORS.muted}? ${UI_COLORS.mutedDark}help${ANSI.reset}  ${UI_COLORS.muted}q ${UI_COLORS.mutedDark}quit${ANSI.reset}`;

  const leftPart = titleContent;
  const rightPart = statusSummary ? `${statusSummary}  ${helpHint}` : helpHint;
  const leftLen = visualLength(leftPart);
  const rightLen = visualLength(rightPart);
  const gap = Math.max(1, width - leftLen - rightLen);

  lines.push(leftPart + " ".repeat(gap) + rightPart);

  const promptLabel = `${UI_COLORS.accent1}Prompt:${ANSI.reset}`;
  const promptText = truncate(ctx.prompt, Math.max(10, width - 9));
  lines.push(`${promptLabel} ${UI_COLORS.textSecondary}${promptText}${ANSI.reset}`);

  const resultsHint =
    loadingCount > 0
      ? "⏳ Results will be saved to .latest-results.yaml"
      : "💾 Results saved to .latest-results.yaml";
  lines.push(truncate(`${UI_COLORS.mutedDark}${resultsHint}${ANSI.reset}`, width));

  return lines;
}

export function renderProviderTabs(ctx: RenderContext, width: number): string[] {
  const tabSegments: string[] = [];

  for (let idx = 0; idx < ctx.providerGroups.length; idx++) {
    const group = ctx.providerGroups[idx];
    const prov = getProvider(group.providerId);

    const { done: doneCount, loading: loadingCount, error: errorCount } = countStatus(group.tabs, ctx.states);

    let statusIndicator: string;
    if (loadingCount > 0) {
      statusIndicator = rainbowSpinner(ctx.spinnerIdx);
    } else if (errorCount > 0) {
      statusIndicator = `${UI_COLORS.error}✘${ANSI.reset}`;
    } else if (doneCount === group.tabs.length) {
      statusIndicator = `${UI_COLORS.success}✔${ANSI.reset}`;
    } else {
      statusIndicator = `${UI_COLORS.muted}○${ANSI.reset}`;
    }

    const count = `${doneCount}/${group.tabs.length}`;

    if (idx === ctx.activeProviderIdx) {
      // Active tab with gradient background effect
      tabSegments.push(
        `${UI_BG_COLORS.active}${ANSI.bold} ${prov.color}${prov.icon} ${prov.name}${ANSI.reset}${UI_BG_COLORS.active} ${UI_COLORS.muted}(${count})${ANSI.reset}${UI_BG_COLORS.active} ${statusIndicator} ${ANSI.reset}`
      );
    } else {
      tabSegments.push(
        ` ${UI_COLORS.mutedDark}${prov.name} (${count})${ANSI.reset} ${statusIndicator} `
      );
    }
  }

  const separator = `${UI_COLORS.border}│${ANSI.reset}`;
  const fullLine = tabSegments.join(separator);
  return [fullLine];
}

function getGridContentLines(
  state: ProviderState & { startedAt?: number },
  width: number
): string[] {
  if (state.status === "loading" || state.status === "idle") {
    let elapsed = "";
    if (state.startedAt) {
      const secs = ((Date.now() - state.startedAt) / 1000).toFixed(1);
      elapsed = ` (${secs}s)`;
    }
    return [`${ANSI.fgGray}Waiting...${elapsed}${ANSI.reset}`];
  }
  if (state.status === "error") {
    return wrapText(state.error ?? "Unknown error", width).map(
      (l) => `${ANSI.fgRed}${l}${ANSI.reset}`
    );
  }
  if (state.status === "skipped") {
    return wrapText(state.error ?? "Skipped", width).map(
      (l) => `${ANSI.fgGray}${l}${ANSI.reset}`
    );
  }
  return wrapText(state.text ?? "", width);
}

function renderPanelContent(
  state: ProviderState & { startedAt?: number } | undefined,
  panelNum: number,
  label: string,
  panelWidth: number,
  panelHeight: number,
  spinnerIdx: number
): string[] {
  const lines: string[] = [];

  const charCount = state?.status === "done" ? state.text?.length : undefined;
  const elapsedMs = state?.status === "done" ? state.elapsed_ms : undefined;
  lines.push(renderPanelHeader(panelNum, label, state?.status, spinnerIdx, panelWidth, charCount, elapsedMs));

  if (!state) {
    lines.push(`${ANSI.fgGray}(empty)${ANSI.reset}`);
    while (lines.length < panelHeight) {
      lines.push("");
    }
    return lines;
  }

  const contentWidth = panelWidth - 2;
  const contentLines = getGridContentLines(state, contentWidth);

  const maxContentLines = panelHeight - 1;
  for (let i = 0; i < maxContentLines; i++) {
    if (i < contentLines.length) {
      lines.push(truncate(contentLines[i], panelWidth));
    } else {
      lines.push("");
    }
  }

  if (contentLines.length > maxContentLines && lines.length > 0) {
    const lastIdx = lines.length - 1;
    lines[lastIdx] = `${ANSI.fgGray}... (press ${panelNum} for full view)${ANSI.reset}`;
  }

  return lines;
}

export function renderGrid(ctx: RenderContext, width: number, height: number): string[] {
  const currentGroup = ctx.providerGroups[ctx.activeProviderIdx];
  if (!currentGroup) return [];

  const lines: string[] = [];

  // Calculate panel dimensions
  const panelWidth = Math.floor((width - 3) / 2); // -3 for borders (│ │ │)
  const availableHeight = height - 6; // header, tabs, top/mid/bottom borders
  const panelHeight = Math.floor((availableHeight - 1) / 2); // -1 for middle border

  // Get panels (max 4)
  const panels: (ProviderState & { startedAt?: number } | undefined)[] = [];
  const labels: string[] = [];
  for (let i = 0; i < 4; i++) {
    const tab = currentGroup.tabs[i];
    if (tab) {
      panels.push(ctx.states.get(tab.id));
      labels.push(tab.label);
    } else {
      panels.push(undefined);
      labels.push("");
    }
  }

  // Render panel contents
  const panel1Lines = renderPanelContent(panels[0], 1, labels[0], panelWidth, panelHeight, ctx.spinnerIdx);
  const panel2Lines = renderPanelContent(panels[1], 2, labels[1], panelWidth, panelHeight, ctx.spinnerIdx);
  const panel3Lines = renderPanelContent(panels[2], 3, labels[2], panelWidth, panelHeight, ctx.spinnerIdx);
  const panel4Lines = renderPanelContent(panels[3], 4, labels[3], panelWidth, panelHeight, ctx.spinnerIdx);

  // Use provider color for border (single solid color)
  const prov = getProvider(currentGroup.providerId);
  const borderColor = prov.color;

  // Top border
  lines.push(`${borderColor}${BOX.rTopLeft}${BOX.horizontal.repeat(panelWidth)}${BOX.teeDown}${BOX.horizontal.repeat(panelWidth)}${BOX.rTopRight}${ANSI.reset}`);

  // Row 1: panels 1 and 2
  for (let i = 0; i < panelHeight; i++) {
    const left = truncate(panel1Lines[i] ?? "", panelWidth);
    const right = truncate(panel2Lines[i] ?? "", panelWidth);
    const leftPad = panelWidth - visualLength(left);
    const rightPad = panelWidth - visualLength(right);
    lines.push(`${borderColor}${BOX.vertical}${ANSI.reset}${left}${" ".repeat(leftPad)}${borderColor}${BOX.vertical}${ANSI.reset}${right}${" ".repeat(rightPad)}${borderColor}${BOX.vertical}${ANSI.reset}`);
  }

  // Middle border
  lines.push(`${borderColor}${BOX.teeRight}${BOX.horizontal.repeat(panelWidth)}${BOX.cross}${BOX.horizontal.repeat(panelWidth)}${BOX.teeLeft}${ANSI.reset}`);

  // Row 2: panels 3 and 4
  for (let i = 0; i < panelHeight; i++) {
    const left = truncate(panel3Lines[i] ?? "", panelWidth);
    const right = truncate(panel4Lines[i] ?? "", panelWidth);
    const leftPad = panelWidth - visualLength(left);
    const rightPad = panelWidth - visualLength(right);
    lines.push(`${borderColor}${BOX.vertical}${ANSI.reset}${left}${" ".repeat(leftPad)}${borderColor}${BOX.vertical}${ANSI.reset}${right}${" ".repeat(rightPad)}${borderColor}${BOX.vertical}${ANSI.reset}`);
  }

  // Bottom border
  lines.push(`${borderColor}${BOX.rBottomLeft}${BOX.horizontal.repeat(panelWidth)}${BOX.teeUp}${BOX.horizontal.repeat(panelWidth)}${BOX.rBottomRight}${ANSI.reset}`);

  return lines;
}

export function renderFullscreenPanel(ctx: RenderContext, width: number, height: number): string[] {
  const currentGroup = ctx.providerGroups[ctx.activeProviderIdx];
  if (!currentGroup || ctx.focusedPanel === null) return [];

  const tab = currentGroup.tabs[ctx.focusedPanel];
  if (!tab) return [];

  const state = ctx.states.get(tab.id);
  if (!state) return [];

  const lines: string[] = [];
  const panelNum = ctx.focusedPanel + 1;

  const charCount = state.status === "done" ? state.text?.length : undefined;
  const elapsedMs = state.status === "done" ? state.elapsed_ms : undefined;
  lines.push(renderPanelHeader(panelNum, tab.label, state.status, ctx.spinnerIdx, width, charCount, elapsedMs));
  lines.push(`${ANSI.fgGray}${BOX.horizontal.repeat(width)}${ANSI.reset}`);

  // Content
  const contentLines = getContentLines(state, width);
  const viewport = height - 5; // header, separator, footer
  const scroll = ctx.scroll.get(tab.id) ?? 0;

  for (let i = 0; i < viewport; i++) {
    const lineIdx = scroll + i;
    if (lineIdx < contentLines.length) {
      lines.push(truncate(contentLines[lineIdx], width));
    } else {
      lines.push("");
    }
  }

  // Footer
  lines.push(`${ANSI.fgGray}${BOX.horizontal.repeat(width)}${ANSI.reset}`);

  let footerParts: string[] = [];

  if (state.status === "done" && state.model) {
    footerParts.push(`${ANSI.fgBrightWhite}${ANSI.bold}${state.model}${ANSI.reset}`);

    const secs = state.elapsed_ms / 1000;
    let timeColor = ANSI.fgBrightGreen;
    if (secs > 10) timeColor = ANSI.fgBrightYellow;
    if (secs > 30) timeColor = ANSI.fgBrightRed;
    footerParts.push(`${timeColor}${secs.toFixed(2)}s${ANSI.reset}`);

    if (state.tokens) {
      const inTok = state.tokens.input_tokens ?? "?";
      const outTok = state.tokens.output_tokens ?? "?";
      footerParts.push(`${ANSI.fgGray}${inTok}→${ANSI.reset}${ANSI.fgBrightCyan}${ANSI.bold}${outTok}${ANSI.reset}${ANSI.fgGray}tok${ANSI.reset}`);
    }
  }

  const scrollInfo = contentLines.length > viewport
    ? `${ANSI.fgGray}${scroll + 1}-${Math.min(scroll + viewport, contentLines.length)}/${contentLines.length}${ANSI.reset}`
    : "";

  const scrollHint = contentLines.length > viewport
    ? `${UI_COLORS.muted}↑↓${ANSI.reset} ${UI_COLORS.mutedDark}scroll${ANSI.reset}  `
    : "";
  const hint = `${scrollHint}${ANSI.fgGray}Press ${ANSI.fgBrightWhite}Esc${ANSI.fgGray}/${ANSI.fgBrightWhite}Enter${ANSI.fgGray}/${ANSI.fgBrightWhite}${panelNum}${ANSI.fgGray} to return${ANSI.reset}`;

  const leftPart = footerParts.join(`  ${ANSI.fgGray}${SYMBOLS.middleDot}${ANSI.reset}  `);
  const rightPart = scrollInfo ? `${scrollInfo}  ${hint}` : hint;
  const gap = Math.max(1, width - visualLength(leftPart) - visualLength(rightPart));
  lines.push(leftPart + " ".repeat(gap) + rightPart);

  return lines;
}

export function composeFinalOutput(
  ctx: RenderContext,
  width: number,
  height: number,
  notification: string | null
): string {
  const lines: string[] = [];

  const headerLines = renderHeader(ctx, width);
  const tabLines = renderProviderTabs(ctx, width);

  lines.push(...headerLines);
  lines.push(...tabLines);

  if (ctx.focusedPanel !== null) {
    const panelLines = renderFullscreenPanel(ctx, width, height - headerLines.length - tabLines.length);
    lines.push(...panelLines);
  } else {
    const gridLines = renderGrid(ctx, width, height - headerLines.length - tabLines.length);
    lines.push(...gridLines);
  }

  // Notification overlay
  if (notification) {
    const notifLine = `  ${ANSI.bgGreen}${ANSI.fgBrightWhite}${ANSI.bold} ${notification} ${ANSI.reset}`;
    if (lines.length > 0) {
      lines[lines.length - 1] = lines[lines.length - 1] + "  " + notifLine;
    }
  }

  // Pad to fill screen
  // Full view needs more space for footer with hint
  const availableHeight = ctx.focusedPanel !== null
    ? Math.max(5, height - 1)
    : Math.max(5, height - 4);
  while (lines.length < availableHeight) {
    lines.push("");
  }

  // Truncate to fit
  if (lines.length > availableHeight) {
    lines.length = availableHeight;
  }

  return "\x1b[2J\x1b[H" + lines.map((l) => truncate(l, width)).join("\n");
}

export function getTerminalDimensions(): { width: number; height: number } {
  return {
    width: process.stdout.columns ?? DEFAULT_TERMINAL_WIDTH,
    height: process.stdout.rows ?? DEFAULT_TERMINAL_HEIGHT,
  };
}

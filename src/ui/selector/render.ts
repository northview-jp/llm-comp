import {
  ANSI,
  BOX,
  SYMBOLS,
  PROVIDERS,
  visualLength,
  boxLine,
  rainbowText,
  NEON_COLORS,
  fgRGB,
  bgRGB,
  GRADIENTS,
  gradientText,
  UI_COLORS,
  UI_BG_COLORS,
} from "../../utils/term.js";
import { truncate } from "../../utils/text.js";
import { SelectionState, SelectedModel, ProviderSelectionState } from "./types.js";
import { ProviderId } from "../../types/index.js";

// Tier badge with vibrant styling
function tierBadge(tier: string): string {
  switch (tier) {
    case "flagship":
      return `${bgRGB(139, 92, 246)}${fgRGB(255, 255, 255)}${ANSI.bold} ⭐ ${ANSI.reset}`;
    case "standard":
      return `${fgRGB(34, 211, 238)}✦${ANSI.reset}`;
    case "fast":
      return `${fgRGB(52, 211, 153)}${SYMBOLS.lightning}${ANSI.reset}`;
    case "legacy":
      return `${ANSI.fgGray}${ANSI.dim}○${ANSI.reset}`;
    default:
      return "";
  }
}

function getProvider(providerId: ProviderId) {
  return PROVIDERS[providerId] || { name: providerId, color: ANSI.fgWhite, icon: "◈" };
}

function renderProviderHeader(
  provider: ProviderSelectionState,
  isExpanded: boolean,
  isCursor: boolean,
  width: number
): string {
  const prov = getProvider(provider.providerId);
  const expandIcon = isExpanded
    ? `${ANSI.fgGray}${SYMBOLS.triangleDown}${ANSI.reset}`
    : `${ANSI.fgGray}${SYMBOLS.triangleRight}${ANSI.reset}`;

  const selectedCount = provider.models.filter((m) => m.selected).length;

  // Selection indicator
  let countDisplay: string;
  if (selectedCount === 0) {
    countDisplay = `${ANSI.fgGray}${ANSI.dim}0/${provider.models.length}${ANSI.reset}`;
  } else if (selectedCount === provider.models.length) {
    countDisplay = `${ANSI.fgBrightGreen}${ANSI.bold}${selectedCount}/${provider.models.length} ${SYMBOLS.checkmark}${ANSI.reset}`;
  } else {
    countDisplay = `${ANSI.fgBrightCyan}${ANSI.bold}${selectedCount}${ANSI.reset}${ANSI.fgGray}/${provider.models.length}${ANSI.reset}`;
  }

  const icon = `${prov.color}${prov.icon}${ANSI.reset}`;
  const name = `${prov.color}${ANSI.bold}${prov.name}${ANSI.reset}`;

  // Cursor indicator
  const cursor = isCursor
    ? `${ANSI.fgBrightCyan}${SYMBOLS.pointer}${ANSI.reset} `
    : "  ";

  const content = `${cursor}${expandIcon} ${icon} ${name}  ${countDisplay}`;
  const line = truncate(content, width);

  if (isCursor) {
    return line;
  }
  return line;
}

function renderModelRow(
  model: { id: string; displayName: string; selected: boolean; tier: string },
  isCursor: boolean,
  width: number
): string {
  // Vibrant checkbox styling
  const checkbox = model.selected
    ? `${UI_COLORS.success}✔${ANSI.reset}`
    : `${UI_COLORS.mutedDark}○${ANSI.reset}`;

  const badge = tierBadge(model.tier);

  // Gradient effect for selected items
  let nameDisplay: string;
  if (model.selected) {
    nameDisplay = `${UI_COLORS.text}${ANSI.bold}${model.displayName}${ANSI.reset}`;
  } else if (isCursor) {
    nameDisplay = `${UI_COLORS.textSecondary}${model.displayName}${ANSI.reset}`;
  } else {
    nameDisplay = `${UI_COLORS.muted}${model.displayName}${ANSI.reset}`;
  }

  // Animated cursor with glow effect
  const cursor = isCursor
    ? `${UI_COLORS.info}❯${ANSI.reset}`
    : " ";

  const badgeWidth = visualLength(badge);
  const badgePadded = badgeWidth > 0 ? ` ${badge}` : "";

  const line = `     ${cursor}  ${checkbox}  ${nameDisplay}${badgePadded}`;

  return truncate(line, width);
}

function renderTitle(width: number): string[] {
  const lines: string[] = [];
  const boxWidth = Math.min(60, width - 4);

  lines.push("");

  // Rainbow gradient title
  const titleText = "LLM Comparison";
  const rainbowTitle = rainbowText(titleText);
  const decorLeft = `${UI_COLORS.accent1}✦${ANSI.reset}`;
  const decorRight = `${fgRGB(244, 114, 182)}✦${ANSI.reset}`;
  const title = `${decorLeft} ${ANSI.bold}${rainbowTitle}${ANSI.reset} ${decorRight}`;
  const titleLen = visualLength(title);
  const leftPad = Math.floor((boxWidth - titleLen) / 2);
  lines.push(" ".repeat(Math.max(2, leftPad)) + title);

  // Gradient subtitle
  const subtitleText = "Select models to compare responses";
  const subtitle = gradientText(subtitleText, [UI_COLORS.muted, fgRGB(203, 213, 225)]);
  const subLen = visualLength(subtitle);
  const subPad = Math.floor((boxWidth - subLen) / 2);
  lines.push(" ".repeat(Math.max(2, subPad)) + subtitle);

  lines.push("");

  // Colorful separator line
  const sepColors = [UI_COLORS.accent1, UI_COLORS.accent3, fgRGB(217, 70, 239), UI_COLORS.accent2, fgRGB(244, 114, 182)];
  let separator = "  ";
  for (let i = 0; i < boxWidth - 2; i++) {
    const colorIdx = Math.floor((i / (boxWidth - 2)) * sepColors.length);
    separator += `${sepColors[colorIdx]}${BOX.horizontal}`;
  }
  separator += ANSI.reset;
  lines.push(separator);

  lines.push("");

  return lines;
}

function renderStatusBar(totalSelected: number, width: number): string[] {
  const lines: string[] = [];
  const boxWidth = Math.min(60, width - 4);

  lines.push("");

  // Colorful separator
  const sepColors = [fgRGB(244, 114, 182), UI_COLORS.accent2, fgRGB(217, 70, 239), UI_COLORS.accent3, UI_COLORS.accent1];
  let separator = "  ";
  for (let i = 0; i < boxWidth - 2; i++) {
    const colorIdx = Math.floor((i / (boxWidth - 2)) * sepColors.length);
    separator += `${sepColors[colorIdx]}${BOX.horizontal}`;
  }
  separator += ANSI.reset;
  lines.push(separator);

  lines.push("");

  // Selection summary with gradient and icons
  let statusIcon: string;
  let statusText: string;

  if (totalSelected === 0) {
    statusIcon = `${UI_COLORS.muted}○${ANSI.reset}`;
    statusText = `${UI_COLORS.muted}No models selected${ANSI.reset}`;
  } else if (totalSelected === 1) {
    statusIcon = `${UI_COLORS.success}✨${ANSI.reset}`;
    statusText = `${UI_COLORS.success}${ANSI.bold}1${ANSI.reset} ${fgRGB(163, 230, 53)}model selected${ANSI.reset}`;
  } else {
    statusIcon = `${UI_COLORS.success}🚀${ANSI.reset}`;
    statusText = `${UI_COLORS.success}${ANSI.bold}${totalSelected}${ANSI.reset} ${fgRGB(163, 230, 53)}models selected${ANSI.reset}`;
  }

  lines.push(`  ${statusIcon} ${statusText}`);
  lines.push("");

  // Vibrant keyboard hints
  const hints = [
    `${UI_COLORS.muted}↑↓${ANSI.reset} ${fgRGB(203, 213, 225)}move${ANSI.reset}`,
    `${UI_BG_COLORS.active}${UI_COLORS.text} SPACE ${ANSI.reset} ${UI_COLORS.info}select${ANSI.reset}`,
    `${bgRGB(22, 163, 74)}${fgRGB(255, 255, 255)} ENTER ${ANSI.reset} ${UI_COLORS.success}go!${ANSI.reset}`,
    `${UI_COLORS.muted}q${ANSI.reset} ${UI_COLORS.mutedDark}quit${ANSI.reset}`,
  ];

  lines.push(`  ${hints.join("  ")}`);

  return lines;
}

export function renderSelectionScreen(
  state: SelectionState,
  width: number,
  height: number
): string {
  const lines: string[] = [];

  // Title section
  lines.push(...renderTitle(width));

  // Error message (shown at top for visibility)
  if (state.errorMessage) {
    lines.push(`  ${UI_COLORS.error}${ANSI.bold}⚠ ${state.errorMessage}${ANSI.reset}`);
    lines.push("");
  }

  // Provider list
  for (let pIdx = 0; pIdx < state.providers.length; pIdx++) {
    const provider = state.providers[pIdx];
    const isExpanded = state.expanded.has(provider.providerId);
    const isCursorOnProvider =
      state.cursorProvider === pIdx && state.cursorModel === -1;

    lines.push(renderProviderHeader(provider, isExpanded, isCursorOnProvider, width));

    if (isExpanded) {
      for (let mIdx = 0; mIdx < provider.models.length; mIdx++) {
        const model = provider.models[mIdx];
        const isCursorOnModel =
          state.cursorProvider === pIdx && state.cursorModel === mIdx;
        lines.push(renderModelRow(model, isCursorOnModel, width));
      }
    }

    // Spacing between providers
    if (pIdx < state.providers.length - 1) {
      lines.push("");
    }
  }

  // Status bar
  const totalSelected = state.providers.reduce(
    (acc, p) => acc + p.models.filter((m) => m.selected).length,
    0
  );
  lines.push(...renderStatusBar(totalSelected, width));

  // Pad to fill screen (use height - 4 for terminal margin)
  const availableHeight = Math.max(5, height - 4);
  while (lines.length < availableHeight) {
    lines.push("");
  }

  return "\x1b[2J\x1b[H" + lines.map((l) => truncate(l, width)).join("\n");
}

function colorfulBoxLine(content: string, innerWidth: number, leftColor: string, rightColor: string): string {
  const contentLen = visualLength(content);
  const padding = Math.max(0, innerWidth - contentLen);
  return `${leftColor}${BOX.vertical}${ANSI.reset} ${content}${" ".repeat(padding)} ${rightColor}${BOX.vertical}${ANSI.reset}`;
}

export function renderConfirmScreen(
  models: SelectedModel[],
  width: number,
  height: number
): string {
  const lines: string[] = [];
  const boxWidth = Math.min(50, width - 4);
  const innerWidth = boxWidth - 4; // Content width inside the box

  lines.push("");

  // Header with rocket emoji and gradient
  const headerText = "Ready to Compare";
  const header = `🚀 ${ANSI.bold}${gradientText(headerText, [UI_COLORS.success, fgRGB(34, 211, 238), UI_COLORS.accent3])}${ANSI.reset}`;
  const headerLen = visualLength(header);
  const headerPad = Math.floor((boxWidth - headerLen) / 2);
  lines.push(" ".repeat(Math.max(2, headerPad)) + header);

  lines.push("");

  // Border colors
  const leftColor = UI_COLORS.accent1;
  const rightColor = UI_COLORS.accent2;
  const midColor = UI_COLORS.accent3;

  // Colorful top border
  lines.push(`  ${leftColor}${BOX.rTopLeft}${midColor}${BOX.horizontal.repeat(innerWidth + 2)}${rightColor}${BOX.rTopRight}${ANSI.reset}`);

  // Model count with sparkle
  const countLine = `${UI_COLORS.info}${ANSI.bold}${models.length}${ANSI.reset} ${UI_COLORS.muted}model${models.length !== 1 ? "s" : ""} will run in parallel ⚡${ANSI.reset}`;
  lines.push(`  ${colorfulBoxLine(countLine, innerWidth, leftColor, rightColor)}`);

  lines.push(`  ${leftColor}${BOX.teeRight}${midColor}${BOX.horizontal.repeat(innerWidth + 2)}${rightColor}${BOX.teeLeft}${ANSI.reset}`);

  // Group by provider
  const byProvider = new Map<ProviderId, SelectedModel[]>();
  for (const model of models) {
    const arr = byProvider.get(model.providerId) || [];
    arr.push(model);
    byProvider.set(model.providerId, arr);
  }

  for (const [providerId, providerModels] of byProvider) {
    const prov = getProvider(providerId);

    // Provider header with icon
    const provLine = `${prov.color}${prov.icon} ${ANSI.bold}${prov.name}${ANSI.reset}`;
    lines.push(`  ${colorfulBoxLine(provLine, innerWidth, leftColor, rightColor)}`);

    // Models with colorful checkmarks
    for (const model of providerModels) {
      const modelLine = `  ${UI_COLORS.success}✔${ANSI.reset} ${UI_COLORS.text}${model.displayName}${ANSI.reset}`;
      lines.push(`  ${colorfulBoxLine(modelLine, innerWidth, leftColor, rightColor)}`);
    }
  }

  // Colorful bottom border
  lines.push(`  ${leftColor}${BOX.rBottomLeft}${midColor}${BOX.horizontal.repeat(innerWidth + 2)}${rightColor}${BOX.rBottomRight}${ANSI.reset}`);

  lines.push("");
  lines.push("");

  // Vibrant confirmation prompt
  const yesKey = `${bgRGB(22, 163, 74)}${fgRGB(255, 255, 255)}${ANSI.bold} Y ${ANSI.reset}`;
  const noKey = `${bgRGB(71, 85, 105)}${UI_COLORS.textSecondary} N ${ANSI.reset}`;
  const prompt = `  ${UI_COLORS.warning}❯${ANSI.reset} ${yesKey} ${UI_COLORS.success}Run comparison${ANSI.reset}  ${noKey} ${UI_COLORS.muted}Go back${ANSI.reset}`;
  lines.push(prompt);

  const availableHeight = Math.max(5, height - 4);
  while (lines.length < availableHeight) {
    lines.push("");
  }

  return "\x1b[2J\x1b[H" + lines.map((l) => truncate(l, width)).join("\n");
}

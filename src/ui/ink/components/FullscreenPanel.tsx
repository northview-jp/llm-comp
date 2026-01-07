import type { ReactElement } from "react";
import { Box, Text } from "ink";
import { ProviderState } from "../../../types/index.js";
import { THEME, getStatusIcon } from "../theme.js";

export interface FullscreenPanelProps {
  tab?: { id: string; label: string };
  state?: ProviderState & { startedAt?: number };
  panelNum: number;
  spinnerIdx: number;
  height: number;
  scroll: number;
}

export function FullscreenPanel({
  tab,
  state,
  panelNum,
  spinnerIdx,
  height,
  scroll,
}: FullscreenPanelProps): ReactElement {
  if (!tab) return <Text color={THEME.muted}>No panel selected</Text>;

  const statusIcon = getStatusIcon(state?.status, spinnerIdx);

  // Calculate visible content with scroll
  const viewport = Math.max(1, height - 6);
  let displayText = "";
  let scrollInfo = "";

  if (state?.status === "done" && state.text) {
    const lines = state.text.split("\n");
    const visibleLines = lines.slice(scroll, scroll + viewport);
    displayText = visibleLines.join("\n");
    if (lines.length > viewport) {
      scrollInfo = ` │ Line ${scroll + 1}-${Math.min(scroll + viewport, lines.length)}/${lines.length}`;
    }
  } else if (state?.status === "loading") {
    displayText = "Waiting for response...";
  } else if (state?.status === "error") {
    displayText = `Error: ${state.error}`;
  } else if (state?.status === "skipped") {
    displayText = `Skipped: ${state?.error}`;
  }

  return (
    <Box flexDirection="column" borderStyle="round" borderColor={THEME.border}>
      <Box>
        <Text bold>[{panelNum}]</Text>
        <Text> {statusIcon}</Text>
        <Text> {tab.label}</Text>
        <Text color={THEME.muted}> │ ↑↓ scroll │ Esc/Enter to return</Text>
      </Box>
      <Box flexGrow={1} flexDirection="column">
        <Text wrap="wrap">{displayText}</Text>
      </Box>
      {state?.status === "done" && (
        <Box>
          <Text color={THEME.muted}>
            {state.model} │ {((state.elapsed_ms ?? 0) / 1000).toFixed(1)}s
            {state.tokens && ` │ ${state.tokens.input_tokens}→${state.tokens.output_tokens}`}
            {scrollInfo}
          </Text>
        </Box>
      )}
    </Box>
  );
}

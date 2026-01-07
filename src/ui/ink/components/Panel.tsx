import type { ReactElement } from "react";
import { Box, Text } from "ink";
import { ProviderState } from "../../../types/index.js";
import { THEME, getStatusIcon, getStatusColor } from "../theme.js";

export interface PanelProps {
  tab: { id: string; label: string };
  state?: ProviderState & { startedAt?: number };
  panelNum: number;
  spinnerIdx: number;
  width: number;
  height: number;
}

export function Panel({
  tab,
  state,
  panelNum,
  spinnerIdx,
  width,
  height,
}: PanelProps): ReactElement {
  const statusIcon = getStatusIcon(state?.status, spinnerIdx);
  const statusColor = getStatusColor(state?.status);

  // Calculate content to display (truncate lines that exceed panel height)
  const contentHeight = Math.max(1, height - 4); // Subtract header and border
  let displayText = "";
  let isTruncated = false;

  if (state?.status === "loading") {
    displayText = "Waiting for response...";
  } else if (state?.status === "done" && state.text) {
    const lines = state.text.split("\n");
    if (lines.length > contentHeight) {
      isTruncated = true;
      // Reserve 1 line for the truncation message
      displayText = lines.slice(0, Math.max(1, contentHeight - 1)).join("\n");
    } else {
      displayText = lines.join("\n");
    }
  } else if (state?.status === "error") {
    displayText = `Error: ${state.error}`;
  } else if (state?.status === "skipped") {
    displayText = `Skipped: ${state.error}`;
  }

  return (
    <Box
      flexDirection="column"
      width={width}
      height={height}
      borderStyle="round"
      borderColor={THEME.border}
      marginRight={1}
      overflow="hidden"
    >
      <Box flexShrink={0}>
        <Text bold>[{panelNum}]</Text>
        <Text color={statusColor}> {statusIcon}</Text>
        <Text> {tab.label}</Text>
        {state?.status === "done" && (
          <Text color={THEME.muted}>
            {" "}({state.text?.length ?? 0} chars) {((state.elapsed_ms ?? 0) / 1000).toFixed(1)}s
          </Text>
        )}
      </Box>
      <Box flexGrow={1} flexShrink={1} overflow="hidden" flexDirection="column">
        <Box flexGrow={1} overflow="hidden">
          <Text wrap="wrap">{displayText}</Text>
        </Box>
        {isTruncated && (
          <Box flexShrink={0} justifyContent="flex-end">
            <Text color={THEME.muted}>...(Press {panelNum} for full)</Text>
          </Box>
        )}
      </Box>
    </Box>
  );
}

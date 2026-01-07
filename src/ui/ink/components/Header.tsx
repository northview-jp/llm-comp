import type { ReactElement } from "react";
import { Box, Text } from "ink";
import { THEME, SPINNER_FRAMES } from "../theme.js";

export interface HeaderProps {
  title: string;
  prompt: string;
  width: number;
  loadingCount: number;
  spinnerIdx: number;
}

export function Header({
  title,
  prompt,
  width,
  loadingCount,
  spinnerIdx,
}: HeaderProps): ReactElement {
  const promptMaxLen = Math.floor(width * 0.6);
  const truncatedPrompt = prompt.length > promptMaxLen
    ? prompt.slice(0, promptMaxLen) + "..."
    : prompt;

  return (
    <Box flexDirection="column" paddingX={1}>
      <Box justifyContent="space-between">
        <Text bold color={THEME.accent1}>
          {title}
        </Text>
        <Text color={THEME.muted}>
          {loadingCount > 0
            ? `${SPINNER_FRAMES[spinnerIdx % SPINNER_FRAMES.length]} ${loadingCount} loading...`
            : "All complete"}
        </Text>
      </Box>
      <Text color={THEME.muted}>
        Prompt: {truncatedPrompt}
      </Text>
      <Box>
        <Text color={THEME.muted}>?/H help  Q quit  1-4 fullscreen  </Text>
        <Text>Results: .latest-results.yaml</Text>
      </Box>
    </Box>
  );
}

import type { ReactElement } from "react";
import { Box, Text } from "ink";
import { MIN_WIDTH, MIN_HEIGHT, THEME } from "../theme.js";

interface TooSmallProps {
  width: number;
  height: number;
}

export function TooSmall({ width, height }: TooSmallProps): ReactElement {
  return (
    <Box flexDirection="column" alignItems="center" justifyContent="center">
      <Text color={THEME.warning}>Terminal too small</Text>
      <Text color={THEME.muted}>
        Current: {width}x{height}
      </Text>
      <Text color={THEME.muted}>
        Required: {MIN_WIDTH}x{MIN_HEIGHT}
      </Text>
    </Box>
  );
}

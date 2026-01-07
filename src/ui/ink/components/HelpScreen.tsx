import type { ReactElement } from "react";
import { Box, Text } from "ink";
import { THEME } from "../theme.js";

export function HelpScreen(): ReactElement {
  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      <Text bold color={THEME.accent1}>
        ✦ Keyboard Shortcuts ✦
      </Text>
      <Box marginTop={1} flexDirection="column">
        <Text color={THEME.warning} bold>
          Navigation
        </Text>
        <Text>Tab / ←→   Switch provider</Text>
        <Text>1-4         View full response</Text>
        <Text>Esc/Enter   Return to grid</Text>
      </Box>
      <Box marginTop={1} flexDirection="column">
        <Text color={THEME.success} bold>
          Actions
        </Text>
        <Text>C           Copy to clipboard</Text>
        <Text>Q           Quit</Text>
        <Text>?/H         Toggle help</Text>
      </Box>
      <Box marginTop={2}>
        <Text color={THEME.muted}>Press any key to close</Text>
      </Box>
    </Box>
  );
}

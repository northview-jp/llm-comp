import type { ReactElement } from "react";
import { useCallback } from "react";
import { Box, Text, useInput } from "ink";
import { SelectedModel } from "../../selector/types.js";
import { THEME } from "../theme.js";
import { PROVIDERS } from "../../../utils/term.js";

interface ConfirmScreenProps {
  models: SelectedModel[];
  width: number;
  height: number;
  onYes: () => void;
  onNo: () => void;
  onQuit: () => void;
}

export function ConfirmScreen({
  models,
  width,
  height,
  onYes,
  onNo,
  onQuit,
}: ConfirmScreenProps): ReactElement {
  useInput(
    useCallback(
      (input: string, key) => {
        if (input === "q" || (key.ctrl && input === "c")) {
          onQuit();
          return;
        }
        if (input === "y" || key.return) {
          onYes();
          return;
        }
        if (input === "n") {
          onNo();
        }
      },
      [onYes, onNo, onQuit]
    )
  );

  // Group models by provider
  const groupedModels = new Map<string, SelectedModel[]>();
  for (const model of models) {
    const existing = groupedModels.get(model.providerId) ?? [];
    existing.push(model);
    groupedModels.set(model.providerId, existing);
  }

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      {/* Header */}
      <Box justifyContent="center" marginBottom={1}>
        <Text bold color={THEME.accent1}>
          ✦ Ready to Compare ✦
        </Text>
      </Box>
      <Box justifyContent="center" marginBottom={1}>
        <Text color={THEME.muted}>
          {models.length} model{models.length !== 1 ? "s" : ""} selected
        </Text>
      </Box>

      {/* Model list */}
      <Box flexDirection="column" marginBottom={2}>
        {Array.from(groupedModels.entries()).map(([providerId, providerModels]) => (
          <Box key={providerId} flexDirection="column" marginBottom={1}>
            <Text bold color={THEME.text}>
              {PROVIDERS[providerId as keyof typeof PROVIDERS]?.name ?? providerId}
            </Text>
            {providerModels.map((model) => (
              <Box key={model.modelId} paddingLeft={2}>
                <Text color={THEME.success}>✔</Text>
                <Text> {model.displayName}</Text>
              </Box>
            ))}
          </Box>
        ))}
      </Box>

      {/* Actions */}
      <Box flexDirection="column" marginTop={1}>
        <Box>
          <Text color={THEME.success} bold>
            Y
          </Text>
          <Text color={THEME.muted}> Run comparison</Text>
        </Box>
        <Box>
          <Text color={THEME.warning} bold>
            N
          </Text>
          <Text color={THEME.muted}> Go back</Text>
        </Box>
        <Box>
          <Text color={THEME.error} bold>
            Q
          </Text>
          <Text color={THEME.muted}> Quit</Text>
        </Box>
      </Box>
    </Box>
  );
}

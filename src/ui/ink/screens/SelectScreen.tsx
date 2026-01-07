import type { ReactElement } from "react";
import { useEffect, useCallback } from "react";
import { Box, Text, useInput } from "ink";
import { ProviderCatalog } from "../../../catalog/index.js";
import { SelectedModel } from "../../selector/types.js";
import { useSelection } from "../hooks/useSelection.js";
import { THEME } from "../theme.js";

interface SelectScreenProps {
  catalog: readonly ProviderCatalog[];
  defaultSelections?: Set<string>;
  width: number;
  height: number;
  onConfirm: (models: SelectedModel[]) => void;
  onQuit: () => void;
}

export function SelectScreen({
  catalog,
  defaultSelections,
  width,
  height,
  onConfirm,
  onQuit,
}: SelectScreenProps): ReactElement {
  const { state, moveUp, moveDown, toggle, clearError, getSelectedModels } =
    useSelection(catalog, defaultSelections);

  // Clear error after timeout
  useEffect(() => {
    if (state.errorMessage) {
      const timer = setTimeout(clearError, 2000);
      return () => clearTimeout(timer);
    }
  }, [state.errorMessage, clearError]);

  useInput(
    useCallback(
      (input: string, key) => {
        if (input === "q" || key.ctrl && input === "c") {
          onQuit();
          return;
        }
        if (key.upArrow) {
          moveUp();
          return;
        }
        if (key.downArrow) {
          moveDown();
          return;
        }
        if (input === " ") {
          toggle();
          return;
        }
        if (key.return) {
          const models = getSelectedModels();
          if (models.length > 0) {
            onConfirm(models);
          }
        }
      },
      [moveUp, moveDown, toggle, getSelectedModels, onConfirm, onQuit]
    )
  );

  const selectedCount = getSelectedModels().length;

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      {/* Header */}
      <Box justifyContent="center" marginBottom={1}>
        <Text bold color={THEME.accent1}>
          ✦ LLM Comparison ✦
        </Text>
      </Box>
      <Box justifyContent="center" marginBottom={1}>
        <Text color={THEME.muted}>Select models to compare</Text>
      </Box>

      {/* Provider list */}
      <Box flexDirection="column" marginBottom={1}>
        {state.providers.map((provider, pIdx) => {
          const isProviderSelected = state.cursorProvider === pIdx && state.cursorModel === -1;
          const isExpanded = state.expanded.has(provider.providerId);
          const providerSelectedCount = provider.models.filter((m) => m.selected).length;

          return (
            <Box key={provider.providerId} flexDirection="column">
              {/* Provider header */}
              <Box>
                <Text
                  inverse={isProviderSelected}
                  color={isProviderSelected ? undefined : THEME.text}
                  bold
                >
                  {isExpanded ? "▼" : "▶"} {provider.displayName}
                </Text>
                <Text color={THEME.muted}>
                  {" "}
                  ({providerSelectedCount}/{provider.models.length})
                </Text>
              </Box>

              {/* Models */}
              {isExpanded &&
                provider.models.map((model, mIdx) => {
                  const isModelSelected =
                    state.cursorProvider === pIdx && state.cursorModel === mIdx;
                  return (
                    <Box key={model.id} paddingLeft={2}>
                      <Text inverse={isModelSelected}>
                        {model.selected ? "◉" : "○"} {model.displayName}
                      </Text>
                      {model.tier === "flagship" && (
                        <Text color={THEME.warning}> ★</Text>
                      )}
                    </Box>
                  );
                })}
            </Box>
          );
        })}
      </Box>

      {/* Footer */}
      <Box flexDirection="column" marginTop={1}>
        {state.errorMessage && (
          <Text color={THEME.error}>{state.errorMessage}</Text>
        )}
        <Box>
          <Text color={selectedCount > 0 ? THEME.success : THEME.muted}>
            {selectedCount === 0
              ? "No models selected"
              : `${selectedCount} model${selectedCount > 1 ? "s" : ""} selected`}
          </Text>
        </Box>
        <Box marginTop={1}>
          <Text color={THEME.muted}>
            ↑↓ Navigate  SPACE Select  ENTER Confirm  q Quit
          </Text>
        </Box>
      </Box>
    </Box>
  );
}

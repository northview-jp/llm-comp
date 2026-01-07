import type { ReactElement } from "react";
import { useEffect, useState } from "react";
import { Box, Text } from "ink";
import { ProviderResponse, ProviderState } from "../../../types/index.js";
import { SelectedModel } from "../../selector/types.js";
import { useTabbed } from "../hooks/useTabbed.js";
import { useCompareKeys } from "../hooks/useCompareKeys.js";
import { ClipboardService } from "../../tabbed/clipboard.js";
import { THEME } from "../theme.js";
import { Panel } from "../components/Panel.js";
import { FullscreenPanel } from "../components/FullscreenPanel.js";
import { HelpScreen } from "../components/HelpScreen.js";
import { Header } from "../components/Header.js";
import { ProviderTabs } from "../components/ProviderTabs.js";

interface CompareScreenProps {
  title: string;
  prompt: string;
  models: SelectedModel[];
  width: number;
  height: number;
  runProvider: (model: SelectedModel) => Promise<ProviderResponse>;
  onComplete: (states: Map<string, unknown>) => void;
  onQuit: () => void;
}

export function CompareScreen({
  title,
  prompt,
  models,
  width,
  height,
  runProvider,
  onComplete,
  onQuit,
}: CompareScreenProps): ReactElement {
  const [clipboard] = useState(() => new ClipboardService());
  const {
    state,
    updateFromResult,
    updateFromError,
    currentTabs,
    setActiveProviderIdx,
    setFocusedPanel,
    setShowHelp,
    setScroll,
    setNotification,
  } = useTabbed({
    title,
    prompt,
    models,
    onAllSettled: onComplete,
  });

  // Start provider calls
  useEffect(() => {
    for (const model of models) {
      runProvider(model)
        .then((response) => updateFromResult(model, response))
        .catch((error) => updateFromError(model, error));
    }
  }, [models, runProvider, updateFromResult, updateFromError]);

  // Keyboard handling
  useCompareKeys({
    state,
    currentTabs,
    height,
    clipboard,
    setActiveProviderIdx,
    setFocusedPanel,
    setShowHelp,
    setNotification,
    setScroll,
    onQuit,
  });

  // Clear notification after timeout
  useEffect(() => {
    if (state.notification) {
      const remaining = state.notification.until - Date.now();
      if (remaining > 0) {
        const timer = setTimeout(() => setNotification(null), remaining);
        return () => clearTimeout(timer);
      }
    }
  }, [state.notification, setNotification]);

  // Help screen
  if (state.showHelp) {
    return <HelpScreen />;
  }

  // Count loading
  let loadingCount = 0;
  for (const [, s] of state.states) {
    if (s.status === "loading") loadingCount++;
  }

  return (
    <Box flexDirection="column" height={height}>
      <Header
        title={title}
        prompt={prompt}
        width={width}
        loadingCount={loadingCount}
        spinnerIdx={state.spinnerIdx}
      />

      <ProviderTabs
        groups={state.providerGroups}
        activeIdx={state.activeProviderIdx}
        states={state.states}
      />

      {/* Content grid */}
      <Box flexDirection="column" flexGrow={1} paddingX={1} marginTop={1}>
        {state.focusedPanel !== null ? (
          <FullscreenPanel
            tab={currentTabs[state.focusedPanel]}
            state={state.states.get(currentTabs[state.focusedPanel]?.id ?? "")}
            panelNum={state.focusedPanel + 1}
            spinnerIdx={state.spinnerIdx}
            height={height - 8}
            scroll={state.scroll.get(currentTabs[state.focusedPanel]?.id ?? "") ?? 0}
          />
        ) : (
          <PanelGrid
            tabs={currentTabs}
            states={state.states}
            spinnerIdx={state.spinnerIdx}
            width={width}
            height={height}
          />
        )}
      </Box>

      {/* Notification */}
      {state.notification && Date.now() < state.notification.until && (
        <Box paddingX={1}>
          <Text color={THEME.success}>{state.notification.msg}</Text>
        </Box>
      )}
    </Box>
  );
}

interface PanelGridProps {
  tabs: { id: string; label: string }[];
  states: Map<string, ProviderState & { startedAt?: number }>;
  spinnerIdx: number;
  width: number;
  height: number;
}

function PanelGrid({ tabs, states, spinnerIdx, width, height }: PanelGridProps): ReactElement {
  const gridHeight = height - 8;
  const rowCount = tabs.length > 2 ? 2 : 1;
  const panelHeight = Math.floor(gridHeight / rowCount);
  const panelWidth = Math.floor((width - 4) / 2);

  return (
    <Box flexDirection="column" flexGrow={1}>
      <Box height={panelHeight}>
        {tabs.slice(0, 2).map((tab, idx) => (
          <Panel
            key={tab.id}
            tab={tab}
            state={states.get(tab.id)}
            panelNum={idx + 1}
            spinnerIdx={spinnerIdx}
            width={panelWidth}
            height={panelHeight}
          />
        ))}
      </Box>
      {tabs.length > 2 && (
        <Box height={panelHeight}>
          {tabs.slice(2, 4).map((tab, idx) => (
            <Panel
              key={tab.id}
              tab={tab}
              state={states.get(tab.id)}
              panelNum={idx + 3}
              spinnerIdx={spinnerIdx}
              width={panelWidth}
              height={panelHeight}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}

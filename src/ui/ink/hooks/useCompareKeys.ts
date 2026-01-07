import { useCallback } from "react";
import { useInput } from "ink";
import { TabInfo } from "../../../types/index.js";
import { TabbedStateData } from "../../tabbed/state.js";
import { ClipboardService } from "../../tabbed/clipboard.js";

export interface UseCompareKeysParams {
  state: TabbedStateData;
  currentTabs: TabInfo[];
  height: number;
  clipboard: ClipboardService;
  setActiveProviderIdx: (idx: number) => void;
  setFocusedPanel: (panel: number | null) => void;
  setShowHelp: (show: boolean) => void;
  setNotification: (msg: string | null) => void;
  setScroll: (tabId: string, scroll: number) => void;
  onQuit: () => void;
}

export function useCompareKeys({
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
}: UseCompareKeysParams): void {
  useInput(
    useCallback(
      (input: string, key) => {
        // Help screen dismissal
        if (state.showHelp) {
          setShowHelp(false);
          return;
        }

        // Quit
        if (input === "q" || (key.ctrl && input === "c")) {
          onQuit();
          return;
        }

        // Help
        if (input === "h" || input === "?") {
          setShowHelp(true);
          return;
        }

        // Panel focus with number keys
        const num = parseInt(input, 10);
        if (num >= 1 && num <= 4) {
          const panelIdx = num - 1;
          if (panelIdx < currentTabs.length) {
            if (state.focusedPanel === panelIdx) {
              setFocusedPanel(null);
            } else {
              setFocusedPanel(panelIdx);
            }
          }
          return;
        }

        // Exit fullscreen (Esc, Enter, or Tab)
        if (state.focusedPanel !== null && (key.escape || key.return || key.tab)) {
          setFocusedPanel(null);
          return;
        }

        // Tab navigation (grid mode only)
        if (state.focusedPanel === null) {
          if (key.tab || key.rightArrow) {
            const next = (state.activeProviderIdx + 1) % state.providerGroups.length;
            setActiveProviderIdx(next);
            return;
          }
          if (key.leftArrow) {
            const prev =
              (state.activeProviderIdx - 1 + state.providerGroups.length) %
              state.providerGroups.length;
            setActiveProviderIdx(prev);
            return;
          }
        }

        // Copy
        if (input === "c") {
          if (state.focusedPanel === null) {
            setNotification("Press 1-4 to select a panel first");
            return;
          }
          const tab = currentTabs[state.focusedPanel];
          if (!tab) return;
          const tabState = state.states.get(tab.id);
          if (tabState?.status === "done" && tabState.text) {
            const result = clipboard.copy(tabState.text);
            setNotification(result.message);
          } else {
            setNotification(`Cannot copy: ${tabState?.status ?? "unknown"}`);
          }
          return;
        }

        // Scroll (fullscreen only)
        if (state.focusedPanel !== null) {
          const tab = currentTabs[state.focusedPanel];
          if (!tab) return;
          const tabState = state.states.get(tab.id);
          if (tabState?.status !== "done" || !tabState.text) return;

          const lines = tabState.text.split("\n");
          const viewport = Math.max(1, height - 10);
          const maxScroll = Math.max(0, lines.length - viewport);
          const currentScroll = state.scroll.get(tab.id) ?? 0;
          let newScroll = currentScroll;

          if (key.downArrow) {
            newScroll = Math.min(currentScroll + 1, maxScroll);
          } else if (key.upArrow) {
            newScroll = Math.max(currentScroll - 1, 0);
          } else if (key.pageDown) {
            newScroll = Math.min(currentScroll + viewport - 2, maxScroll);
          } else if (key.pageUp) {
            newScroll = Math.max(currentScroll - (viewport - 2), 0);
          } else if (input === "g" && key.shift) {
            // Shift+G = end (vim-like)
            newScroll = maxScroll;
          } else if (input === "g") {
            // g = home (vim-like)
            newScroll = 0;
          }

          if (newScroll !== currentScroll) {
            setScroll(tab.id, newScroll);
          }
        }
      },
      [
        state,
        currentTabs,
        height,
        setActiveProviderIdx,
        setFocusedPanel,
        setShowHelp,
        setNotification,
        setScroll,
        clipboard,
        onQuit,
      ]
    )
  );
}

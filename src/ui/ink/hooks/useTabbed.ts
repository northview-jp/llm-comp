import { useState, useCallback, useEffect } from "react";
import { ProviderResponse, TabInfo } from "../../../types/index.js";
import { SelectedModel } from "../../selector/types.js";
import {
  TabbedStateData,
  createInitialState,
  isAllSettled,
  updateFromResult as updateState,
  updateFromError as updateError,
  getCurrentProviderTabs,
} from "../../tabbed/state.js";
import { SPINNER_INTERVAL_MS } from "../../../constants.js";

export interface UseTabbedReturn {
  state: TabbedStateData;
  updateFromResult: (model: SelectedModel, response: ProviderResponse) => void;
  updateFromError: (model: SelectedModel, error: unknown) => void;
  isSettled: boolean;
  currentTabs: TabInfo[];
  setActiveProviderIdx: (idx: number) => void;
  setFocusedPanel: (panel: number | null) => void;
  setShowHelp: (show: boolean) => void;
  setScroll: (tabId: string, scroll: number) => void;
  setNotification: (msg: string | null) => void;
}

export function useTabbed(params: {
  title: string;
  prompt: string;
  models: SelectedModel[];
  onAllSettled?: (states: Map<string, unknown>) => void;
}): UseTabbedReturn {
  const [state, setState] = useState<TabbedStateData>(() =>
    createInitialState(params)
  );

  // Spinner animation
  useEffect(() => {
    if (isAllSettled(state)) return;

    const timer = setInterval(() => {
      setState((prev) => ({ ...prev, spinnerIdx: prev.spinnerIdx + 1 }));
    }, SPINNER_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [state]);

  // Check if settled and fire callback
  useEffect(() => {
    if (isAllSettled(state) && !state.settledCallbackFired) {
      setState((prev) => ({ ...prev, settledCallbackFired: true }));
      params.onAllSettled?.(state.states);
    }
  }, [state, params.onAllSettled]);

  const updateFromResult = useCallback(
    (model: SelectedModel, response: ProviderResponse) => {
      setState((prev) => {
        const next = { ...prev, states: new Map(prev.states) };
        updateState(next, model, response);
        return next;
      });
    },
    []
  );

  const updateFromError = useCallback((model: SelectedModel, error: unknown) => {
    setState((prev) => {
      const next = { ...prev, states: new Map(prev.states) };
      updateError(next, model, error);
      return next;
    });
  }, []);

  const setActiveProviderIdx = useCallback((idx: number) => {
    setState((prev) => ({ ...prev, activeProviderIdx: idx }));
  }, []);

  const setFocusedPanel = useCallback((panel: number | null) => {
    setState((prev) => ({ ...prev, focusedPanel: panel }));
  }, []);

  const setShowHelp = useCallback((show: boolean) => {
    setState((prev) => ({ ...prev, showHelp: show }));
  }, []);

  const setScroll = useCallback((tabId: string, scroll: number) => {
    setState((prev) => {
      const newScroll = new Map(prev.scroll);
      newScroll.set(tabId, scroll);
      return { ...prev, scroll: newScroll };
    });
  }, []);

  const setNotification = useCallback((msg: string | null) => {
    setState((prev) => ({
      ...prev,
      notification: msg ? { msg, until: Date.now() + 2000 } : null,
    }));
  }, []);

  return {
    state,
    updateFromResult,
    updateFromError,
    isSettled: isAllSettled(state),
    currentTabs: getCurrentProviderTabs(state),
    setActiveProviderIdx,
    setFocusedPanel,
    setShowHelp,
    setScroll,
    setNotification,
  };
}

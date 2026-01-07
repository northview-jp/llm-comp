import { ProviderId, ProviderState, ProviderResponse, isProviderSuccess, TabInfo, ProviderGroup } from "../../types/index.js";
import { PROVIDERS } from "../../utils/term.js";
import { SelectedModel } from "../selector/types.js";

function createTabId(providerId: ProviderId, modelId: string): string {
  return `${providerId}:${modelId}`;
}

function getProviderDisplayName(providerId: ProviderId): string {
  return PROVIDERS[providerId]?.name ?? providerId;
}

export interface TabbedStateData {
  readonly providerGroups: ProviderGroup[];
  readonly title: string;
  readonly prompt: string;
  activeProviderIdx: number;
  focusedPanel: number | null;
  spinnerIdx: number;
  showHelp: boolean;
  states: Map<string, ProviderState & { startedAt?: number }>;
  scroll: Map<string, number>;
  notification: { msg: string; until: number } | null;
  settledCallbackFired: boolean;
}

export function createInitialState(params: {
  title: string;
  prompt: string;
  models: SelectedModel[];
}): TabbedStateData {
  const groupMap = new Map<ProviderId, TabInfo[]>();
  for (const m of params.models) {
    const tab: TabInfo = {
      id: createTabId(m.providerId, m.modelId),
      providerId: m.providerId,
      modelId: m.modelId,
      label: m.displayName,
    };
    const existing = groupMap.get(m.providerId) ?? [];
    existing.push(tab);
    groupMap.set(m.providerId, existing);
  }

  const providerGroups = Array.from(groupMap.entries()).map(([providerId, tabs]) => ({
    providerId,
    displayName: getProviderDisplayName(providerId),
    tabs,
  }));

  const states = new Map<string, ProviderState & { startedAt?: number }>();
  const scroll = new Map<string, number>();

  const now = Date.now();
  for (const group of providerGroups) {
    for (const tab of group.tabs) {
      states.set(tab.id, {
        status: "loading",
        label: tab.label,
        startedAt: now,
      });
      scroll.set(tab.id, 0);
    }
  }

  return {
    providerGroups,
    title: params.title,
    prompt: params.prompt,
    activeProviderIdx: 0,
    focusedPanel: null,
    spinnerIdx: 0,
    showHelp: false,
    states,
    scroll,
    notification: null,
    settledCallbackFired: false,
  };
}

export function getCurrentProviderTabs(state: TabbedStateData): TabInfo[] {
  return state.providerGroups[state.activeProviderIdx]?.tabs ?? [];
}

export function isAllSettled(state: TabbedStateData): boolean {
  for (const group of state.providerGroups) {
    for (const tab of group.tabs) {
      const s = state.states.get(tab.id)?.status;
      if (s === "loading" || s === "idle") return false;
    }
  }
  return true;
}

export function updateFromResult(
  state: TabbedStateData,
  model: SelectedModel,
  r: ProviderResponse
): void {
  const tabId = createTabId(model.providerId, model.modelId);
  const currentState = state.states.get(tabId);
  if (!currentState) return;

  if (isProviderSuccess(r)) {
    state.states.set(tabId, {
      status: "done",
      label: currentState.label,
      model: r.model,
      text: r.text,
      elapsed_ms: r.elapsed_ms,
      tokens: r.tokens,
      raw: r.text === "(empty response)" ? r.raw : undefined,
    });
  } else {
    const isSkipped = r.failureType === "api_key_missing" || r.failureType === "disabled";
    state.states.set(tabId, {
      status: isSkipped ? "skipped" : "error",
      label: currentState.label,
      model: r.model,
      error: r.message,
      elapsed_ms: r.elapsed_ms,
    });
  }
}

export function updateFromError(
  state: TabbedStateData,
  model: SelectedModel,
  err: unknown
): void {
  const tabId = createTabId(model.providerId, model.modelId);
  const currentState = state.states.get(tabId);
  if (!currentState) return;

  const msg = err instanceof Error ? err.message : String(err);
  state.states.set(tabId, {
    status: "error",
    label: currentState.label,
    error: msg,
    elapsed_ms: 0,
  });
}

export { createTabId };

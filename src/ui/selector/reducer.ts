import { SelectionState } from "./types.js";

export type SelectionAction =
  | { type: "MOVE_UP" }
  | { type: "MOVE_DOWN" }
  | { type: "TOGGLE" }
  | { type: "CLEAR_ERROR" };

export interface ReduceResult {
  state: SelectionState;
  error?: string;
}

export function reduceSelectionState(
  state: SelectionState,
  action: SelectionAction
): ReduceResult {
  switch (action.type) {
    case "MOVE_UP":
      return { state: moveUp(state) };
    case "MOVE_DOWN":
      return { state: moveDown(state) };
    case "TOGGLE":
      return toggle(state);
    case "CLEAR_ERROR":
      return { state: { ...state, errorMessage: null } };
    default:
      return { state };
  }
}

function moveUp(state: SelectionState): SelectionState {
  const { cursorProvider, cursorModel, providers, expanded } = state;

  if (cursorModel > 0) {
    return { ...state, cursorModel: cursorModel - 1 };
  }

  if (cursorModel === 0) {
    return { ...state, cursorModel: -1 };
  }

  if (cursorProvider > 0) {
    const prevIdx = cursorProvider - 1;
    const prevProvider = providers[prevIdx];
    const prevExpanded = expanded.has(prevProvider.providerId);

    if (prevExpanded && prevProvider.models.length > 0) {
      return {
        ...state,
        cursorProvider: prevIdx,
        cursorModel: prevProvider.models.length - 1,
      };
    }
    return { ...state, cursorProvider: prevIdx, cursorModel: -1 };
  }

  return state;
}

function moveDown(state: SelectionState): SelectionState {
  const { cursorProvider, cursorModel, providers, expanded } = state;
  const currentProvider = providers[cursorProvider];
  const isExpanded = expanded.has(currentProvider.providerId);

  if (cursorModel === -1) {
    if (isExpanded && currentProvider.models.length > 0) {
      return { ...state, cursorModel: 0 };
    }
    if (cursorProvider < providers.length - 1) {
      return { ...state, cursorProvider: cursorProvider + 1, cursorModel: -1 };
    }
    return state;
  }

  if (cursorModel < currentProvider.models.length - 1) {
    return { ...state, cursorModel: cursorModel + 1 };
  }

  if (cursorProvider < providers.length - 1) {
    return { ...state, cursorProvider: cursorProvider + 1, cursorModel: -1 };
  }

  return state;
}

function toggle(state: SelectionState): ReduceResult {
  const { cursorProvider, cursorModel, providers, expanded } = state;
  const currentProvider = providers[cursorProvider];

  if (cursorModel === -1) {
    const newExpanded = new Set(expanded);
    if (newExpanded.has(currentProvider.providerId)) {
      newExpanded.delete(currentProvider.providerId);
    } else {
      newExpanded.add(currentProvider.providerId);
    }
    return { state: { ...state, expanded: newExpanded } };
  }

  const model = currentProvider.models[cursorModel];

  if (!model.selected) {
    const selectedCount = currentProvider.models.filter((m) => m.selected).length;
    if (selectedCount >= 4) {
      return {
        state: { ...state, errorMessage: "Max 4 models per provider" },
        error: "Max 4 models per provider",
      };
    }
  }

  const newProviders = providers.map((p, pIdx) => {
    if (pIdx !== cursorProvider) return p;
    return {
      ...p,
      models: p.models.map((m, mIdx) => {
        if (mIdx !== cursorModel) return m;
        return { ...m, selected: !m.selected };
      }),
    };
  });

  return { state: { ...state, providers: newProviders, errorMessage: null } };
}

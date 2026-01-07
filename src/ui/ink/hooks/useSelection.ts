import { useReducer, useCallback, useMemo } from "react";
import { ProviderCatalog } from "../../../catalog/index.js";
import {
  SelectionState,
  SelectedModel,
  ProviderSelectionState,
} from "../../selector/types.js";
import { reduceSelectionState, SelectionAction } from "../../selector/reducer.js";

function createInitialState(
  catalog: readonly ProviderCatalog[],
  defaultSelections?: Set<string>
): SelectionState {
  const providers: ProviderSelectionState[] = catalog.map((p) => ({
    providerId: p.providerId,
    displayName: p.displayName,
    models: p.models.map((m) => ({
      id: m.id,
      displayName: m.displayName,
      selected: defaultSelections?.has(`${p.providerId}:${m.id}`) ?? false,
      tier: m.tier,
    })),
  }));

  return {
    providers,
    cursorProvider: 0,
    cursorModel: providers.length > 0 && providers[0].models.length > 0 ? 0 : -1,
    expanded: new Set(catalog.map((p) => p.providerId)),
    errorMessage: null,
  };
}

function reducer(state: SelectionState, action: SelectionAction): SelectionState {
  return reduceSelectionState(state, action).state;
}

export interface UseSelectionReturn {
  state: SelectionState;
  moveUp: () => void;
  moveDown: () => void;
  toggle: () => void;
  clearError: () => void;
  getSelectedModels: () => SelectedModel[];
}

export function useSelection(
  catalog: readonly ProviderCatalog[],
  defaultSelections?: Set<string>
): UseSelectionReturn {
  const initialState = useMemo(
    () => createInitialState(catalog, defaultSelections),
    [catalog, defaultSelections]
  );

  const [state, dispatch] = useReducer(reducer, initialState);

  const moveUp = useCallback(() => dispatch({ type: "MOVE_UP" }), []);
  const moveDown = useCallback(() => dispatch({ type: "MOVE_DOWN" }), []);
  const toggle = useCallback(() => dispatch({ type: "TOGGLE" }), []);
  const clearError = useCallback(() => dispatch({ type: "CLEAR_ERROR" }), []);

  const getSelectedModels = useCallback((): SelectedModel[] => {
    const result: SelectedModel[] = [];
    for (const provider of state.providers) {
      for (const model of provider.models) {
        if (model.selected) {
          result.push({
            providerId: provider.providerId,
            modelId: model.id,
            displayName: model.displayName,
          });
        }
      }
    }
    return result;
  }, [state.providers]);

  return {
    state,
    moveUp,
    moveDown,
    toggle,
    clearError,
    getSelectedModels,
  };
}

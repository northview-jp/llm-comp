/**
 * Test utilities for UI components
 */

/**
 * Creates a testable selector state (without TTY requirements)
 */
function createTestSelector(config) {
  const providers = config.providers.map((p) => ({
    providerId: p.providerId,
    displayName: p.displayName,
    models: p.models.map((m) => ({
      id: m.id,
      displayName: m.displayName,
      selected: m.selected ?? false,
      tier: m.tier ?? "standard",
    })),
  }));

  const state = {
    providers,
    cursorProvider: 0,
    cursorModel: -1,
    expanded: new Set(providers.map((p) => p.providerId)),
    errorMessage: null,
  };

  return {
    getState() {
      return state;
    },
    handleKey(key) {
      handleSelectorKey(state, key);
    },
  };
}

function handleSelectorKey(state, key) {
  if (key === "up") {
    moveUp(state);
    return;
  }

  if (key === "down") {
    moveDown(state);
    return;
  }

  if (key === "space") {
    toggleSelection(state);
    return;
  }
}

function moveUp(state) {
  const { cursorProvider, cursorModel, providers, expanded } = state;

  if (cursorModel > 0) {
    state.cursorModel--;
    return;
  }

  if (cursorModel === 0) {
    state.cursorModel = -1;
    return;
  }

  if (cursorProvider > 0) {
    const prevIdx = cursorProvider - 1;
    const prevProvider = providers[prevIdx];
    const prevExpanded = expanded.has(prevProvider.providerId);

    state.cursorProvider = prevIdx;
    if (prevExpanded && prevProvider.models.length > 0) {
      state.cursorModel = prevProvider.models.length - 1;
    } else {
      state.cursorModel = -1;
    }
  }
}

function moveDown(state) {
  const { cursorProvider, cursorModel, providers, expanded } = state;
  const currentProvider = providers[cursorProvider];
  const isExpanded = expanded.has(currentProvider.providerId);

  if (cursorModel === -1) {
    if (isExpanded && currentProvider.models.length > 0) {
      state.cursorModel = 0;
      return;
    }
    if (cursorProvider < providers.length - 1) {
      state.cursorProvider++;
      state.cursorModel = -1;
    }
    return;
  }

  if (cursorModel < currentProvider.models.length - 1) {
    state.cursorModel++;
    return;
  }

  if (cursorProvider < providers.length - 1) {
    state.cursorProvider++;
    state.cursorModel = -1;
  }
}

function toggleSelection(state) {
  const { cursorProvider, cursorModel, providers, expanded } = state;
  const currentProvider = providers[cursorProvider];

  if (cursorModel === -1) {
    if (expanded.has(currentProvider.providerId)) {
      expanded.delete(currentProvider.providerId);
    } else {
      expanded.add(currentProvider.providerId);
    }
    return;
  }

  const model = currentProvider.models[cursorModel];

  if (!model.selected) {
    const selectedCount = currentProvider.models.filter(
      (m) => m.selected
    ).length;
    if (selectedCount >= 4) {
      state.errorMessage = "Max 4 models per provider";
      return;
    }
  }

  model.selected = !model.selected;
  state.errorMessage = null;
}

function simulateKeyPress(selector, key) {
  selector.handleKey(key);
}

export {
  createTestSelector,
  simulateKeyPress,
};

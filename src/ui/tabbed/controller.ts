import { Key } from "../../utils/term.js";
import { clamp } from "../../utils/text.js";
import { TabbedStateData, getCurrentProviderTabs } from "./state.js";
import { getContentLines, getTerminalDimensions } from "./render.js";
import { ClipboardService, IClipboardService } from "./clipboard.js";

export type ControllerAction =
  | { type: "quit" }
  | { type: "render" }
  | { type: "notify"; message: string }
  | { type: "none" };

export class TabbedController {
  private clipboard: IClipboardService;

  constructor(clipboard?: IClipboardService) {
    this.clipboard = clipboard ?? new ClipboardService();
  }

  handleKey(state: TabbedStateData, key: Key): ControllerAction {
    if (key === "ctrlC" || key === "q") {
      return { type: "quit" };
    }

    if (state.showHelp) {
      state.showHelp = false;
      return { type: "render" };
    }

    if (key === "h" || key === "?") {
      state.showHelp = true;
      return { type: "render" };
    }

    if (state.focusedPanel !== null) {
      return this.handleFullscreenKey(state, key);
    }

    return this.handleGridKey(state, key);
  }

  private handleFullscreenKey(state: TabbedStateData, key: Key): ControllerAction {
    if (key === "esc" || key === "enter") {
      state.focusedPanel = null;
      return { type: "render" };
    }

    const numKeys = ["1", "2", "3", "4"] as const;
    const numIdx = numKeys.indexOf(key as typeof numKeys[number]);
    if (numIdx >= 0) {
      const tabs = getCurrentProviderTabs(state);
      if (numIdx < tabs.length) {
        state.focusedPanel = numIdx === state.focusedPanel ? null : numIdx;
        return { type: "render" };
      }
      return { type: "none" };
    }

    if (key === "c") {
      return this.handleCopy(state);
    }

    return this.handleScroll(state, key);
  }

  private handleGridKey(state: TabbedStateData, key: Key): ControllerAction {
    if (key === "tab" || key === "right") {
      state.activeProviderIdx = (state.activeProviderIdx + 1) % state.providerGroups.length;
      return { type: "render" };
    }

    if (key === "shiftTab" || key === "left") {
      state.activeProviderIdx =
        (state.activeProviderIdx - 1 + state.providerGroups.length) % state.providerGroups.length;
      return { type: "render" };
    }

    const numKeys = ["1", "2", "3", "4"] as const;
    const numIdx = numKeys.indexOf(key as typeof numKeys[number]);
    if (numIdx >= 0) {
      const tabs = getCurrentProviderTabs(state);
      if (numIdx < tabs.length) {
        state.focusedPanel = numIdx;
        return { type: "render" };
      }
      return { type: "none" };
    }

    if (key === "c") {
      return this.handleCopy(state);
    }

    return { type: "none" };
  }

  private handleScroll(state: TabbedStateData, key: Key): ControllerAction {
    const tabs = getCurrentProviderTabs(state);
    if (state.focusedPanel === null || state.focusedPanel >= tabs.length) {
      return { type: "none" };
    }

    const activeTab = tabs[state.focusedPanel];
    const { width, height } = getTerminalDimensions();
    const viewport = Math.max(1, height - 8);
    const currentState = state.states.get(activeTab.id);
    if (!currentState) return { type: "none" };

    const lines = getContentLines(currentState, width);
    const maxScroll = Math.max(0, lines.length - viewport);
    const currentScroll = state.scroll.get(activeTab.id) ?? 0;

    let newScroll = currentScroll;

    switch (key) {
      case "down":
        newScroll = clamp(currentScroll + 1, 0, maxScroll);
        break;
      case "up":
        newScroll = clamp(currentScroll - 1, 0, maxScroll);
        break;
      case "pageDown":
        newScroll = clamp(currentScroll + Math.max(1, viewport - 2), 0, maxScroll);
        break;
      case "pageUp":
        newScroll = clamp(currentScroll - Math.max(1, viewport - 2), 0, maxScroll);
        break;
      case "home":
        newScroll = 0;
        break;
      case "end":
        newScroll = maxScroll;
        break;
      default:
        return { type: "none" };
    }

    if (newScroll !== currentScroll) {
      state.scroll.set(activeTab.id, newScroll);
      return { type: "render" };
    }

    return { type: "none" };
  }

  private handleCopy(state: TabbedStateData): ControllerAction {
    const tabs = getCurrentProviderTabs(state);
    if (state.focusedPanel === null || state.focusedPanel >= tabs.length) {
      return { type: "notify", message: "Press 1-4 to select a panel first" };
    }

    const activeTab = tabs[state.focusedPanel];
    const currentState = state.states.get(activeTab.id);

    if (!currentState || currentState.status !== "done") {
      if (currentState?.status === "loading" || currentState?.status === "idle") {
        return { type: "notify", message: "Still loading..." };
      }
      if (currentState?.status === "error") {
        return { type: "notify", message: "Cannot copy error" };
      }
      if (currentState?.status === "skipped") {
        return { type: "notify", message: "Skipped" };
      }
      return { type: "notify", message: "Nothing to copy" };
    }

    const result = this.clipboard.copy(currentState.text ?? "");
    return { type: "notify", message: result.message };
  }
}

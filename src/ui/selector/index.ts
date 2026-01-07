import { ANSI, decodeKey, Key } from "../../utils/term.js";
import { ProviderCatalog } from "../../catalog/index.js";
import {
  SelectionState,
  SelectionResult,
  SelectedModel,
  ProviderSelectionState,
} from "./types.js";
import { renderSelectionScreen, renderConfirmScreen } from "./render.js";
import { reduceSelectionState, SelectionAction } from "./reducer.js";

export type { SelectionResult, SelectedModel } from "./types.js";

function getTerminalDimensions(): { width: number; height: number } {
  return {
    width: process.stdout.columns ?? 80,
    height: process.stdout.rows ?? 24,
  };
}

export class ModelSelector {
  private state: SelectionState;
  private confirmMode = false;
  private closed = false;
  private resolve: ((result: SelectionResult) => void) | null = null;

  constructor(catalog: readonly ProviderCatalog[], defaultSelections?: Set<string>) {
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

    this.state = {
      providers,
      cursorProvider: 0,
      cursorModel: providers.length > 0 && providers[0].models.length > 0 ? 0 : -1,
      expanded: new Set(catalog.map((p) => p.providerId)),
      errorMessage: null,
    };
  }

  run(): Promise<SelectionResult> {
    return new Promise((resolve) => {
      this.resolve = resolve;

      if (!process.stdin.isTTY || !process.stdout.isTTY) {
        resolve({ confirmed: false, models: [] });
        return;
      }

      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdout.write(ANSI.hideCursor);

      const onData = (buf: Buffer) => this.onKey(decodeKey(buf));
      process.stdin.on("data", onData);

      const cleanup = () => {
        process.stdin.off("data", onData);
        try {
          if (process.stdin.isTTY) process.stdin.setRawMode(false);
        } catch {
          // ignore
        }
        process.stdout.write(ANSI.showCursor);
        process.stdout.write(ANSI.reset);
        process.stdout.write(ANSI.clear);
      };

      this.render();

      const originalResolve = this.resolve;
      this.resolve = (result) => {
        cleanup();
        originalResolve(result);
      };
    });
  }

  private onKey(key: Key): void {
    if (this.closed) return;

    if (key === "ctrlC" || key === "q") {
      this.closed = true;
      this.resolve?.({ confirmed: false, models: [] });
      return;
    }

    if (this.confirmMode) {
      if (key === "y" || key === "enter") {
        this.closed = true;
        this.resolve?.({ confirmed: true, models: this.getSelectedModels() });
        return;
      }
      if (key === "n") {
        this.confirmMode = false;
        this.render();
        return;
      }
      return;
    }

    const action = this.keyToAction(key);
    if (action) {
      const result = reduceSelectionState(this.state, action);
      this.state = result.state;
      this.render();
      return;
    }

    if (key === "enter") {
      const selected = this.getSelectedModels();
      if (selected.length > 0) {
        this.confirmMode = true;
        this.render();
      }
      return;
    }
  }

  private keyToAction(key: Key): SelectionAction | null {
    switch (key) {
      case "up":
        return { type: "MOVE_UP" };
      case "down":
        return { type: "MOVE_DOWN" };
      case "space":
        return { type: "TOGGLE" };
      default:
        return null;
    }
  }

  private getSelectedModels(): SelectedModel[] {
    const result: SelectedModel[] = [];
    for (const provider of this.state.providers) {
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
  }

  private render(): void {
    if (this.closed) return;

    const { width, height } = getTerminalDimensions();

    if (this.confirmMode) {
      process.stdout.write(renderConfirmScreen(this.getSelectedModels(), width, height));
      return;
    }

    process.stdout.write(renderSelectionScreen(this.state, width, height));
  }
}

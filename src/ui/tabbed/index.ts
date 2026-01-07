import { ANSI, decodeKey } from "../../utils/term.js";
import { ProviderState, ProviderResponse, TabInfo } from "../../types/index.js";
import { SPINNER_INTERVAL_MS } from "../../constants.js";
import {
  RenderContext,
  composeFinalOutput,
  getTerminalDimensions,
  renderHelpScreen,
} from "./render.js";
import { SelectedModel } from "../selector/types.js";
import {
  TabbedStateData,
  createInitialState,
  isAllSettled,
  updateFromResult,
  updateFromError,
} from "./state.js";
import { TabbedController, ControllerAction } from "./controller.js";

export type { TabInfo };

export class TabbedUI {
  private state: TabbedStateData;
  private controller: TabbedController;
  private readonly onAllSettled?: (states: Map<string, ProviderState>) => void;

  private interval: NodeJS.Timeout | null = null;
  private closed = false;

  constructor(params: {
    title: string;
    prompt: string;
    models: SelectedModel[];
    onAllSettled?: (states: Map<string, ProviderState>) => void;
  }) {
    this.state = createInitialState(params);
    this.controller = new TabbedController();
    this.onAllSettled = params.onAllSettled;
  }

  start(): void {
    if (!process.stdin.isTTY || !process.stdout.isTTY) {
      throw new Error("Interactive mode unavailable. Set 'ui.mode: json' for piped output.");
    }

    process.stdin.setRawMode(true);
    process.stdin.resume();

    process.stdout.write(ANSI.hideCursor);

    const onData = (buf: Buffer) => this.onKey(decodeKey(buf));
    process.stdin.on("data", onData);

    const onResize = () => this.render();
    process.stdout.on("resize", onResize);
    process.on("SIGWINCH", onResize);

    this.interval = setInterval(() => {
      this.state.spinnerIdx++;
      this.render();
    }, SPINNER_INTERVAL_MS);

    this.render();

    const cleanup = () => {
      process.stdin.off("data", onData);
      process.stdout.off("resize", onResize);
      process.off("SIGWINCH", onResize);
    };

    process.on("exit", cleanup);
  }

  close(): void {
    if (this.closed) return;
    this.closed = true;

    if (this.interval) clearInterval(this.interval);
    this.interval = null;

    try {
      if (process.stdin.isTTY) process.stdin.setRawMode(false);
    } catch {
      // ignore
    }

    process.stdout.write(ANSI.showCursor);
    process.stdout.write(ANSI.reset);
  }

  updateFromResult(model: SelectedModel, r: ProviderResponse): void {
    if (this.closed) return;

    updateFromResult(this.state, model, r);
    this.render();
    this.checkSettled();
  }

  updateFromError(model: SelectedModel, err: unknown): void {
    if (this.closed) return;

    updateFromError(this.state, model, err);
    this.render();
    this.checkSettled();
  }

  private checkSettled(): void {
    if (isAllSettled(this.state) && this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      this.render();
      this.fireSettledCallback();
    }
  }

  private fireSettledCallback(): void {
    if (this.state.settledCallbackFired) return;
    this.state.settledCallbackFired = true;
    this.onAllSettled?.(this.state.states);
  }

  isAllSettled(): boolean {
    return isAllSettled(this.state);
  }

  private onKey(key: import("../../utils/term.js").Key): void {
    const action = this.controller.handleKey(this.state, key);
    this.handleAction(action);
  }

  private handleAction(action: ControllerAction): void {
    switch (action.type) {
      case "quit":
        this.close();
        process.exit(0);
        break;
      case "render":
        this.render();
        break;
      case "notify":
        this.notify(action.message);
        break;
      case "none":
        break;
    }
  }

  private notify(msg: string): void {
    this.state.notification = { msg, until: Date.now() + 2000 };
    this.render();
  }

  private render(): void {
    if (this.closed) return;

    const { width, height } = getTerminalDimensions();

    if (this.state.showHelp) {
      process.stdout.write(renderHelpScreen(width, height, this.state.focusedPanel !== null));
      return;
    }

    const currentGroup = this.state.providerGroups[this.state.activeProviderIdx];
    if (!currentGroup) return;

    const ctx: RenderContext = {
      title: this.state.title,
      prompt: this.state.prompt,
      providerGroups: this.state.providerGroups,
      activeProviderIdx: this.state.activeProviderIdx,
      focusedPanel: this.state.focusedPanel,
      spinnerIdx: this.state.spinnerIdx,
      states: this.state.states,
      scroll: this.state.scroll,
    };

    const notification =
      this.state.notification && Date.now() < this.state.notification.until
        ? this.state.notification.msg
        : null;

    const output = composeFinalOutput(ctx, width, height, notification);
    process.stdout.write(output);
  }
}

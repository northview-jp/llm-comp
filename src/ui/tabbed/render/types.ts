import { ProviderState, ProviderGroup } from "../../../types/index.js";

export interface RenderContext {
  readonly title: string;
  readonly prompt: string;
  readonly providerGroups: ProviderGroup[];
  readonly activeProviderIdx: number;
  readonly focusedPanel: number | null;
  readonly spinnerIdx: number;
  readonly states: Map<string, ProviderState & { startedAt?: number }>;
  readonly scroll: Map<string, number>;
}

export interface StatusCounts {
  done: number;
  loading: number;
  error: number;
}

export interface ScrollInfo {
  readonly scroll: number;
  readonly total: number;
  readonly viewport: number;
}

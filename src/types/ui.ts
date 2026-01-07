import { ProviderId, TokenUsage } from "./provider.js";

export interface TabInfo {
  readonly id: string;
  readonly providerId: ProviderId;
  readonly modelId: string;
  readonly label: string;
}

export interface ProviderGroup {
  readonly providerId: ProviderId;
  readonly displayName: string;
  readonly tabs: TabInfo[];
}

export type ProviderState =
  | {
      readonly status: "idle" | "loading";
      readonly label: string;
      readonly model?: string;
      readonly text?: string;
      readonly error?: string;
      readonly elapsed_ms?: number;
      readonly tokens?: TokenUsage;
    }
  | {
      readonly status: "done";
      readonly label: string;
      readonly model: string;
      readonly text: string;
      readonly elapsed_ms: number;
      readonly tokens?: TokenUsage;
      readonly raw?: unknown;
    }
  | {
      readonly status: "error" | "skipped";
      readonly label: string;
      readonly model?: string;
      readonly text?: string;
      readonly error: string;
      readonly elapsed_ms: number;
      readonly tokens?: TokenUsage;
    };

import { ProviderId } from "../../types/index.js";

export interface ModelSelectionState {
  id: string;
  displayName: string;
  selected: boolean;
  tier: string;
}

export interface ProviderSelectionState {
  providerId: ProviderId;
  displayName: string;
  models: ModelSelectionState[];
}

export interface SelectionState {
  providers: ProviderSelectionState[];
  cursorProvider: number;
  cursorModel: number; // -1 = on provider header
  expanded: Set<string>;
  errorMessage: string | null;
}

export interface SelectedModel {
  providerId: ProviderId;
  modelId: string;
  displayName: string;
}

export interface SelectionResult {
  confirmed: boolean;
  models: SelectedModel[];
}

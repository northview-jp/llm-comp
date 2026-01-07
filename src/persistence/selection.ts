import fs from "fs";
import path from "path";
import { ProviderId } from "../types/index.js";

interface SavedSelection {
  selectedModels: { providerId: ProviderId; modelId: string }[];
  updatedAt: string;
}

const SELECTION_FILE = ".llm-comp-selection.json";

export function loadSelection(cwd: string): Set<string> {
  const filePath = path.join(cwd, SELECTION_FILE);
  if (!fs.existsSync(filePath)) return new Set();

  try {
    const data = JSON.parse(fs.readFileSync(filePath, "utf8")) as SavedSelection;
    return new Set(data.selectedModels.map((m) => `${m.providerId}:${m.modelId}`));
  } catch {
    return new Set();
  }
}

export function saveSelection(
  cwd: string,
  models: { providerId: ProviderId; modelId: string }[]
): void {
  const filePath = path.join(cwd, SELECTION_FILE);
  const data: SavedSelection = {
    selectedModels: models,
    updatedAt: new Date().toISOString(),
  };
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
}

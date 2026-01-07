import type { ReactElement } from "react";
import { useState, useCallback } from "react";
import { Box } from "ink";
import { ProviderCatalog } from "../../catalog/index.js";
import { ProviderResponse } from "../../types/index.js";
import { SelectedModel } from "../selector/types.js";
import { useTerminalSize } from "./hooks/useTerminalSize.js";
import { TooSmall } from "./components/TooSmall.js";
import { SelectScreen } from "./screens/SelectScreen.js";
import { ConfirmScreen } from "./screens/ConfirmScreen.js";
import { CompareScreen } from "./screens/CompareScreen.js";
import { MIN_WIDTH, MIN_HEIGHT } from "./theme.js";

type Screen = "select" | "confirm" | "compare";

interface AppProps {
  catalog: readonly ProviderCatalog[];
  defaultSelections?: Set<string>;
  prompt: string;
  title: string;
  runProvider: (model: SelectedModel) => Promise<ProviderResponse>;
  onComplete: (states: Map<string, unknown>) => void;
  onSelectionSave?: (models: SelectedModel[]) => void;
  onQuit: () => void;
}

export function App({
  catalog,
  defaultSelections,
  prompt,
  title,
  runProvider,
  onComplete,
  onSelectionSave,
  onQuit,
}: AppProps): ReactElement {
  const { width, height } = useTerminalSize();
  const [screen, setScreen] = useState<Screen>("select");
  const [selectedModels, setSelectedModels] = useState<SelectedModel[]>([]);

  const handleSelectionConfirm = useCallback(
    (models: SelectedModel[]) => {
      setSelectedModels(models);
      onSelectionSave?.(models);
      setScreen("confirm");
    },
    [onSelectionSave]
  );

  const handleConfirmYes = useCallback(() => {
    setScreen("compare");
  }, []);

  const handleConfirmNo = useCallback(() => {
    setScreen("select");
  }, []);

  if (width < MIN_WIDTH || height < MIN_HEIGHT) {
    return <TooSmall width={width} height={height} />;
  }

  return (
    <Box flexDirection="column" width={width} height={height}>
      {screen === "select" && (
        <SelectScreen
          catalog={catalog}
          defaultSelections={defaultSelections}
          width={width}
          height={height}
          onConfirm={handleSelectionConfirm}
          onQuit={onQuit}
        />
      )}
      {screen === "confirm" && (
        <ConfirmScreen
          models={selectedModels}
          width={width}
          height={height}
          onYes={handleConfirmYes}
          onNo={handleConfirmNo}
          onQuit={onQuit}
        />
      )}
      {screen === "compare" && (
        <CompareScreen
          title={title}
          prompt={prompt}
          models={selectedModels}
          width={width}
          height={height}
          runProvider={runProvider}
          onComplete={onComplete}
          onQuit={onQuit}
        />
      )}
    </Box>
  );
}

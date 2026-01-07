import type { ReactElement } from "react";
import { Box, Text } from "ink";
import { ProviderState } from "../../../types/index.js";

export interface ProviderGroup {
  providerId: string;
  displayName: string;
  tabs: { id: string; label: string }[];
}

export interface ProviderTabsProps {
  groups: ProviderGroup[];
  activeIdx: number;
  states: Map<string, ProviderState>;
}

export function ProviderTabs({
  groups,
  activeIdx,
  states,
}: ProviderTabsProps): ReactElement {
  return (
    <Box paddingX={1} marginTop={1}>
      {groups.map((group, idx) => {
        const isActive = idx === activeIdx;
        const groupDone = group.tabs.filter(
          (t) => states.get(t.id)?.status !== "loading"
        ).length;
        return (
          <Box key={group.providerId} marginRight={2}>
            <Text inverse={isActive} bold={isActive}>
              {" "}
              {group.displayName} ({groupDone}/{group.tabs.length}){" "}
            </Text>
          </Box>
        );
      })}
    </Box>
  );
}

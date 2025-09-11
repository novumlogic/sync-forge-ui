import { DnDProvider } from "@providers/dnd_provider";
import FocusProvider from "@providers/focus_provider";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { ReactFlowProvider } from "@xyflow/react";
import type { JSX } from "react";

export const Route = createFileRoute("/builder/$builderId")({
  component: BuilderLayout,
});

function BuilderLayout(): JSX.Element {
  return (
    <DnDProvider>
      <FocusProvider focusNodeProps={null}>
        <ReactFlowProvider>
          <Outlet />
        </ReactFlowProvider>
      </FocusProvider>
    </DnDProvider>
  );
}

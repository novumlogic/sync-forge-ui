import { DnDProvider } from "@providers/dnd_provider";
import { ReactFlowProvider } from "@xyflow/react";
import type { JSX } from "react";
import { Outlet } from "react-router";

export default function BuilderLayout(): JSX.Element {
  return (
    <DnDProvider>
      <ReactFlowProvider>
        <Outlet />
      </ReactFlowProvider>
    </DnDProvider>
  );
}

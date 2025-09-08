import { ReactFlowProvider } from "@xyflow/react";
import type { JSX } from "react";
import { Outlet } from "react-router";

export default function BuilderLayout(): JSX.Element {
  return (
    <ReactFlowProvider>
      <Outlet />
    </ReactFlowProvider>
  );
}

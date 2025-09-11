import Database from "@controllers/database";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { DnDProvider } from "@providers/dnd_provider";
import FocusProvider from "@providers/focus_provider";
import type { JSX } from "react";

const database: Database = new Database();

export const Route = createFileRoute("/builder/$builderId")({
  loader: async ({ params }) => {
    const workflowResult = await database.getQuery(params.builderId);

    if (!workflowResult.ok) {
      throw Error(workflowResult.error.error);
    }

    return {
      workflow: workflowResult.value.payload,
    };
  },

  errorComponent: (p) => {
    return <div>{JSON.stringify(p.error.message)}</div>;
  },
  pendingComponent: () => {
    return <div>Loading..</div>;
  },
  component: BuilderLayout,
});

function BuilderLayout(): JSX.Element {
  return (
    <DnDProvider>
      <FocusProvider focusNodeProps={null}>
        <Outlet />
      </FocusProvider>
    </DnDProvider>
  );
}
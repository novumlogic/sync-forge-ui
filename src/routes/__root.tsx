import Navbar from "@components/navbar";
import { Toaster } from "@components/ui/sonner";
import Database from "@controllers/database";
import { DependencyGraph } from "@lib/dependency_graph";
import DatabaseProvider from "@providers/database_provider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import type { JSX } from "react";

const queryClient = new QueryClient();
const database: Database = new Database();

export const Route = createRootRoute({
  loader: async () => {
    const schemaResult = await database.getDatabaseSchema();

    if (!schemaResult.ok) {
      throw Error(schemaResult.error.error);
    }

    return {
      schema: schemaResult.value.payload,
    };
  },

  component: RootLayout,
  notFoundComponent: () => {
    return (
      <div className={"flex min-h-screen"}>
        <div className="m-auto">
          <h4 className={"text-2xl font-bold"}>Not Found</h4>
        </div>
      </div>
    );
  },
});

function RootLayout(): JSX.Element {
  const { schema } = Route.useLoaderData();

  return (
    <QueryClientProvider client={queryClient}>
      <DatabaseProvider
        store={{
          schema: schema,
          graph: new DependencyGraph(schema),
        }}
      >
        <Toaster />
        <div className={"flex min-h-dvh flex-col"}>
          <Navbar />
          <main className={"pt-18"}>
            <Outlet />
          </main>
        </div>
      </DatabaseProvider>
    </QueryClientProvider>
  );
}

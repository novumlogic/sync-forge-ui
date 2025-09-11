/*
 * Copyright (c) 2025 Novumlogic Technologies Pvt Ltd
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

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

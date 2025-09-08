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

import { useContext } from "react";
import { DatabaseContext } from "@providers/database_provider";
import type { DatabaseSchema } from "@type/database_schema";
import type { DependencyGraph } from "@lib/dependency_graph";

type Overwrite<T, U> = Omit<T, keyof U> & U;

type ContextValue = React.ContextType<typeof DatabaseContext>;

type InitializedContext = Overwrite<
  ContextValue,
  {
    store: {
      schema: DatabaseSchema;
      graph: DependencyGraph;
    };
  }
>;

function useDatabase(options: { initialized: true }): InitializedContext;
function useDatabase(options?: { initialized?: boolean }): ContextValue;

/**
 * Accesses the database context provided by DatabaseProvider.
 * Throws an error if used outside of the provider.
 * @returns The database context value.
 */
function useDatabase(options?: { initialized?: boolean }) {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error(
      "useDatabase Hook must be used within the Database Provider",
    );
  }

  if (options?.initialized === true) {
    const { schema, graph } = context.store;

    if (!schema || !graph) {
      throw new Error("Database not initialized: schema/graph missing");
    }

    return {
      ...context,
      store: { schema, graph },
    } satisfies InitializedContext;
  }

  return context;
}

export default useDatabase;

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

import {
  createContext,
  type Dispatch,
  type ReactNode,
  useReducer,
} from "react";
import type { DatabaseSchema } from "@type/database_schema";
import { DependencyGraph } from "@lib/dependency_graph";

export type DatabaseAction = {
  type: "SET_SCHEMA";
  payload: {
    schema: DatabaseSchema;
  };
};

export interface DatabaseStore {
  schema: DatabaseSchema | null;
  graph: DependencyGraph | null;
}

const databaseReducer = (
  store: DatabaseStore,
  action: DatabaseAction,
): DatabaseStore => {
  switch (action.type) {
    case "SET_SCHEMA": {
      return {
        schema: action.payload.schema,
        graph: new DependencyGraph(action.payload.schema),
      };
    }
    default: {
      return store;
    }
  }
};

export const DatabaseContext = createContext<{
  store: DatabaseStore;
  dispatch: Dispatch<DatabaseAction>;
}>({
  store: {
    schema: null,
    graph: null,
  },
  dispatch: () => undefined,
});

export interface DatabaseProviderProps {
  children: ReactNode;
  store: DatabaseStore;
}

const DatabaseProvider = ({
  children,
  store,
}: Readonly<DatabaseProviderProps>) => {
  const [state, dispatch] = useReducer(databaseReducer, store);

  return (
    <DatabaseContext.Provider
      value={{
        store: state,
        dispatch: dispatch,
      }}
    >
      {children}
    </DatabaseContext.Provider>
  );
};

export default DatabaseProvider;

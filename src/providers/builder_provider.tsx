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
import type {
  BuilderNode,
  SelectNodeProperties,
} from "@type/node_properties";
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type Edge,
  type EdgeChange,
  type NodeChange,
  type ReactFlowInstance,
} from "@xyflow/react";
import deepClone from "lodash.clonedeep";
import type { DatabaseSchema } from "@type/database_schema";

export interface BuilderState {
  nodes: Array<BuilderNode>;
  edges: Array<Edge>;
  instance: ReactFlowInstance<BuilderNode, Edge> | null;
}

export type BuilderAction =
  | {
      type: "SET_INSTANCE";
      payload: {
        instace: ReactFlowInstance<BuilderNode, Edge>;
      };
    }
  | {
      type: "ADD_NODE";
      payload: {
        node: BuilderNode;
      };
    }
  | {
      type: "ADD_EDGE";
      payload: {
        connection: Connection;
        schema: DatabaseSchema;
        focusedNodeId: string | null;
      };
    }
  | {
      type: "UPDATE_NODE";
      payload: {
        changes: Array<NodeChange>;
      };
    }
  | {
      type: "UPDATE_EDGE";
      payload: {
        changes: Array<EdgeChange>;
      };
    };

export interface BuilderContextValue extends BuilderState {
  dispatch: Dispatch<BuilderAction>;
}

const builderReducer = (
  state: BuilderState,
  action: BuilderAction,
): BuilderState => {
  const stateCopy = deepClone(state);

  switch (action.type) {
    case "SET_INSTANCE": {
      stateCopy.instance = action.payload.instace;
      break;
    }
    case "ADD_NODE": {
      if (stateCopy.nodes.some((node) => node.id === action.payload.node.id))
        return stateCopy;

      stateCopy.nodes.push(action.payload.node);

      break;
    }
    case "ADD_EDGE": {
      stateCopy.edges = addEdge(
        action.payload.connection,
        stateCopy.edges,
      ) as Array<Edge>;

      const sourceNodeIndex = stateCopy.nodes.findIndex(
        (node) => node.id === action.payload.connection.source,
      );

      const targetNodeIndex = stateCopy.nodes.findIndex(
        (node) => node.id === action.payload.connection.target,
      );

      if (sourceNodeIndex === -1 || targetNodeIndex === -1) {
        return stateCopy;
      }

      const sourceNode = stateCopy.nodes[sourceNodeIndex];
      const targetNode = stateCopy.nodes[targetNodeIndex];

      if (
        sourceNode.data.type === "table" &&
        targetNode.data.type === "select"
      ) {
        const sourceTable = sourceNode.data;
        const targetSelect = targetNode.data;

        stateCopy.nodes[targetNodeIndex].data = {
          ...targetSelect,
          table: sourceTable.id,
          columns: action.payload.schema[sourceTable.id].reduce(
            (acc, col) => {
              acc[col.column_name] = { selected: false };
              return acc;
            },
            {} as Record<string, { selected: boolean }>,
          ),
        } satisfies SelectNodeProperties;
      }

      document.dispatchEvent(
        new CustomEvent("focusedNodeMutation", {
          bubbles: true,
          detail:
            action.payload.focusedNodeId === sourceNode.id
              ? stateCopy.nodes[sourceNodeIndex].data
              : action.payload.focusedNodeId === targetNode.id
                ? stateCopy.nodes[targetNodeIndex].data
                : null,
        }),
      );

      break;
    }
    case "UPDATE_NODE": {
      stateCopy.nodes = applyNodeChanges(
        action.payload.changes,
        stateCopy.nodes,
      ) as Array<BuilderNode>;
      break;
    }
    case "UPDATE_EDGE": {
      stateCopy.edges = applyEdgeChanges(
        action.payload.changes,
        stateCopy.edges,
      ) as Array<Edge>;
      break;
    }
    default: {
      break;
    }
  }

  return stateCopy;
};

export const BuilderContext = createContext<BuilderContextValue>({
  nodes: [],
  edges: [],
  instance: null,
  dispatch: () => undefined,
});

export interface BuilderProviderProps {
  children: ReactNode;
  state: BuilderState;
}

const BuilderProvider = ({
  children,
  state,
}: Readonly<BuilderProviderProps>) => {
  const [initialState, dispatch] = useReducer(builderReducer, state);

  return (
    <BuilderContext.Provider
      value={{
        ...initialState,
        dispatch: dispatch,
      }}
    >
      {children}
    </BuilderContext.Provider>
  );
};

export default BuilderProvider;

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

import { FiltersPanel, TableDetailsPanel } from "@components/panels";
import { Button } from "@components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@components/ui/resizable";
import { ScrollArea } from "@components/ui/scroll_area";
import { FILTERS, SIDEPANEL_DEFAULT_WIDTH } from "@constants";
import Database from "@controllers/database";
import { XMarkIcon } from "@heroicons/react/24/outline";
import useDatabase from "@hooks/use_database";
import useFocus from "@hooks/use_focus";
import Builder from "@pages/builder";
import { DnDProvider } from "@providers/dnd_provider";
import FocusProvider from "@providers/focus_provider";
import { useQuery } from "@tanstack/react-query";
import type {
  AnyNodeProps,
  BuilderNode,
  SelectNodeProperties,
} from "@type/node_properties";
import { addEdge, ReactFlowProvider, useReactFlow, type Connection, type Edge } from "@xyflow/react";
import {
  createElement,
  Fragment,
  useCallback,
  useEffect,
  useRef,
  type JSX,
} from "react";
import type { ImperativePanelHandle } from "react-resizable-panels";
import { useParams } from "react-router";

const database: Database = new Database();

export default function BuilderLayout(): JSX.Element {
  return (
    <DnDProvider>
      <FocusProvider focusNodeProps={null}>
        <ReactFlowProvider>
          <BuilderMetaLayout />
        </ReactFlowProvider>
      </FocusProvider>
    </DnDProvider>
  );
}

function BuilderMetaLayout(): JSX.Element {
  const { builderId } = useParams<{ builderId: string }>();
  const {
    store: { schema, graph },
    dispatch,
  } = useDatabase();
  const { getNode, setEdges, setNodes, updateNodeData, setViewport } =
    useReactFlow<BuilderNode, Edge>();

  const { focusedNodeProps, dispatch: focusDispatch } = useFocus();

  const filterPanelRef = useRef<ImperativePanelHandle>(null);

  const schemaRequest = useQuery({
    queryKey: ["database_schema"],
    enabled: schema === null,
    queryFn: async () => {
      const schemaFetchResult = await database.getDatabaseSchema();
      if (!schemaFetchResult.ok) {
        throw new Error("Failed to fetch database schema");
      }

      return schemaFetchResult.value.payload;
    },
  });

  const queryRequest = useQuery({
    queryKey: [builderId],
    refetchOnWindowFocus: false,
    enabled: Boolean(schema) || schemaRequest.isSuccess,
    queryFn: async () => {
      if (builderId === undefined) {
        throw new Error("Builder ID is required");
      }

      const result = await database.getQuery(builderId);
      const data = result.ok
        ? result.value.payload
        : {
            nodes: [],
            edges: [],
            viewport: {
              x: 0,
              y: 0,
              zoom: 1,
            },
          };

      return data;
    },
  });

  const nodeClickHandler = useCallback(
    (node: AnyNodeProps) => {
      focusDispatch({ type: "FOCUS_NODE", payload: { properties: node } });

      if (!filterPanelRef.current?.isExpanded()) {
        filterPanelRef.current?.expand(SIDEPANEL_DEFAULT_WIDTH);
      }
    },
    [focusDispatch],
  );

  const newNodeHandler = useCallback(
    (node: BuilderNode) => {
      if (getNode(node.id) !== undefined) return;

      setNodes((nodes) => [...nodes, node]);
    },
    [getNode, setNodes],
  );

  const connectionHandler = useCallback(
    (connection: Connection) => {
      setEdges((edges) => addEdge(connection, edges));

      const sourceNode = getNode(connection.source);
      const targetNode = getNode(connection.target);

      if (
        sourceNode === undefined ||
        targetNode === undefined ||
        schema === null
      ) {
        return;
      }

      if (
        sourceNode.data.type === "table" &&
        targetNode.data.type === "select"
      ) {
        const sourceTable = sourceNode.data;
        const targetSelect = targetNode.data;

        updateNodeData(targetNode.id, {
          ...targetSelect,
          table: sourceTable.id,
          columns: schema[sourceTable.id].reduce(
            (acc, col) => {
              acc[col.column_name] = { selected: false };
              return acc;
            },
            {} as Record<string, { selected: boolean }>,
          ),
        } satisfies SelectNodeProperties);

      }
    },
    [getNode, schema, setEdges, updateNodeData],
  );

  useEffect(() => {
    if (schemaRequest.data === undefined) return;

    dispatch({
      type: "SET_SCHEMA",
      payload: {
        schema: schemaRequest.data,
      },
    });
  }, [dispatch, schemaRequest.data]);

  useEffect(() => {
    if (queryRequest.data === undefined) return;

    setNodes(queryRequest.data.nodes);
    setEdges(queryRequest.data.edges);
    setViewport(queryRequest.data.viewport);
  }, [queryRequest.data, setEdges, setNodes, setViewport]);

  if (schemaRequest.isLoading || queryRequest.isLoading) {
    return <div>Loading...</div>;
  }
  

  return (
    <ResizablePanelGroup
      direction={"horizontal"}
      className={"max-h-[92.7dvh] w-dvw"}
    >
      <ResizablePanel
        order={0}
        defaultSize={SIDEPANEL_DEFAULT_WIDTH}
        maxSize={SIDEPANEL_DEFAULT_WIDTH}
        collapsible={true}
      >
        <TableDetailsPanel schema={schemaRequest.data!} />
      </ResizablePanel>
      <ResizableHandle className={"bg-border"} />
      <ResizablePanel
        order={1}
        defaultSize={Math.abs(100 - SIDEPANEL_DEFAULT_WIDTH)}
      >
        <Builder
          graph={graph}
          initialNodes={queryRequest.data?.nodes ?? []}
          initialEdges={queryRequest.data?.edges ?? []}
          onNodeClick={nodeClickHandler}
          onNodeAdded={newNodeHandler}
          onConnectionAdded={connectionHandler}
        />
      </ResizablePanel>
      <ResizableHandle
        hidden={focusedNodeProps === null}
        className={"bg-border"}
      />
      <ResizablePanel
        order={2}
        defaultSize={0}
        maxSize={SIDEPANEL_DEFAULT_WIDTH}
        collapsible={true}
        ref={filterPanelRef}
      >
        <div className={"text-foreground h-full w-full bg-stone-900"}>
          <div className={"flex items-center justify-between px-3 py-4"}>
            <div className={"flex items-center space-x-2"}>
              <h5 className={"font-medium"}>
                {focusedNodeProps?.type === "table" ? "Filters" : "Properties"}
              </h5>
            </div>
            <Button
              size={"icon"}
              variant={"secondary"}
              className={"cursor-pointer bg-transparent"}
              onClick={() => {
                focusDispatch({ type: "CLEAR_FOCUS" });
                filterPanelRef.current?.collapse();
              }}
            >
              <XMarkIcon />
            </Button>
          </div>
          <div className={"flex h-full w-full flex-col items-start"}>
            <ScrollArea
              className={
                "bg-background text-foreground h-full w-full px-2 pt-3 pb-20"
              }
            >
              {focusedNodeProps !== null &&
              focusedNodeProps.type !== "table" ? (
                <Fragment>
                  {FILTERS.map((filter) => (
                    <div key={filter.display_name}>
                      {createElement(filter.panelComponent, focusedNodeProps)}
                    </div>
                  ))}
                </Fragment>
              ) : (
                <FiltersPanel filters={FILTERS} />
              )}
            </ScrollArea>
          </div>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

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
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@components/ui/resizable";
import { ScrollArea } from "@components/ui/scroll_area";
import Database from "@controllers/database";
import {
  type AnyNodeProps,
  type BuilderNode,
  type DragNodePayload,
  type NodePropertiesMap,
} from "@type/node_properties";
import useDatabase from "@hooks/use_database";
import {
  addEdge,
  Background,
  BackgroundVariant,
  Panel,
  ReactFlow,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type Edge,
  type ReactFlowInstance,
} from "@xyflow/react";
import { FilterIcon, SaveIcon, Table2Icon } from "lucide-react";
import {
  Fragment,
  useCallback,
  useEffect,
  useRef,
  useState,
  type JSX,
  type DragEvent,
} from "react";
import type { ImperativePanelHandle } from "react-resizable-panels";
import { Button } from "@components/ui/button";
import { PlayIcon, XMarkIcon } from "@heroicons/react/24/solid";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@components/ui/tooltip";
import "@xyflow/react/dist/style.css";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useParams } from "react-router";
import { TableNode, SelectNode } from "@components/nodes";
import useDnD from "@hooks/use_dnd";
import { nanoid } from "nanoid";
import { FILTERS, SIDEPANEL_DEFAULT_WIDTH } from "@constants";
import { isConnectionValid } from "@lib/validators";

const database: Database = new Database();

export default function Builder(): JSX.Element {
  const { builderId } = useParams<{ builderId: string }>();
  const { schema, dispatch } = useDatabase();
  const { screenToFlowPosition } = useReactFlow();
  const [nodeProperties, setNodeProperties] = useDnD();

  const queryBuilderContainerRef = useRef<HTMLDivElement | null>(null);
  const filterPanelRef = useRef<ImperativePanelHandle>(null);

  const [reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance<BuilderNode> | null>(null);
  const [focusedNode, setFocusedNode] = useState<AnyNodeProps | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<BuilderNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

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

      if (result.ok) {
        return result.value.payload;
      }

      return {
        nodes: [],
        edges: [],
        viewport: {
          x: 0,
          y: 0,
          zoom: 1,
        },
      };
    },
  });

  const onNodeDragStart = useCallback(
    <K extends keyof NodePropertiesMap>(
      event: DragEvent,
      props: NodePropertiesMap[K] & { type: K },
    ) => {
      const payload: DragNodePayload<K> = {
        type: props.type,
        props,
      };

      setNodeProperties(payload);
      event.dataTransfer!.effectAllowed = "move";
    },
    [setNodeProperties],
  );

  const canvasDragStartHandler = useCallback(
    (event: DragEvent) => {
      setNodeProperties(nodeProperties);
      event.dataTransfer.effectAllowed = "move";
    },
    [nodeProperties, setNodeProperties],
  );

  const canvasDragOverHandler = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const canvasDropHandler = useCallback(
    (event: DragEvent) => {
      event.preventDefault();

      if (!nodeProperties) return;

      const { left, top } = event.currentTarget.getBoundingClientRect();

      const position = screenToFlowPosition({
        x: event.clientX - left / 2,
        y: event.clientY - top / 2,
      });

      const newNode: BuilderNode = {
        id: nodeProperties.props.id,
        position,
        type: nodeProperties.type,
        data: nodeProperties.props,
      } as BuilderNode;

      setNodes((nodes) => [...nodes, newNode]);
    },
    [nodeProperties, screenToFlowPosition, setNodes],
  );

  const connectionHandler = useCallback(
    (connection: Connection) => setEdges((edges) => addEdge(connection, edges)),
    [setEdges],
  );

  useEffect(() => {
    if (schemaRequest.data !== undefined) {
      dispatch({
        type: "SET_SCHEMA",
        payload: { schema: schemaRequest.data },
      });
    }
  }, [schemaRequest.data, dispatch]);

  useEffect(() => {
    if (queryRequest.data !== undefined) {
      setNodes(queryRequest.data.nodes);
      setEdges(queryRequest.data.edges);
      reactFlowInstance?.setViewport(queryRequest.data.viewport);
    }
  }, [queryRequest.data, reactFlowInstance, setEdges, setNodes]);

  const nodeClickHandler = useCallback((node: AnyNodeProps) => {
    setFocusedNode(node);

    if (!filterPanelRef.current?.isExpanded()) {
      filterPanelRef.current?.expand(SIDEPANEL_DEFAULT_WIDTH);
    }
  }, []);

  const pushQueryHandler = useCallback(async () => {
    if (reactFlowInstance === null || builderId === undefined) return;

    const graph = reactFlowInstance.toObject();

    const result = await database.saveQuery(builderId, graph);
    if (result.ok) {
      toast("Query Saved.");
    } else {
      toast(
        `Query failed: ${String((result.error.raw as { error: string; status_code: string }).error)}`,
      );
    }
  }, [builderId, reactFlowInstance]);

  useEffect(() => {
    if (queryBuilderContainerRef.current === null || reactFlowInstance === null)
      return;

    let timer: ReturnType<typeof setTimeout> | undefined;

    const observer = new ResizeObserver(() => {
      clearTimeout(timer);

      timer = setTimeout(() => {
        const viewPort = reactFlowInstance.getViewport();
        reactFlowInstance.setViewport(viewPort, {
          duration: 0,
        });
      });
    });

    observer.observe(queryBuilderContainerRef.current);

    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, [reactFlowInstance]);

  if (schema === null) {
    return <Fragment />;
  }

  return (
    <div className="h-[92.5dvh]">
      <ResizablePanelGroup direction={"horizontal"} className={"h-full"}>
        <ResizablePanel
          order={0}
          defaultSize={SIDEPANEL_DEFAULT_WIDTH}
          className={"h-full"}
          maxSize={SIDEPANEL_DEFAULT_WIDTH}
          collapsible={true}
        >
          <div
            className={
              "bg-background text-foreground flex w-full items-center justify-start px-3 pt-5 pb-3 font-bold"
            }
          >
            <h3>Tables</h3>
          </div>
          <ScrollArea
            className={
              "bg-background text-foreground h-[92.5dvh] w-full px-2 pt-3 pb-20"
            }
          >
            {(Object.keys(schema) as string[]).map((table) => (
              <div
                key={table}
                draggable={true}
                className={
                  "mb-3 flex h-10 cursor-pointer items-center space-x-2 rounded-lg border px-2 py-3 font-semibold transition-all duration-150 select-none hover:bg-stone-800"
                }
                onClick={() => {
                  reactFlowInstance?.fitView({
                    nodes: [
                      {
                        id: table,
                      },
                    ],
                    duration: 1000,
                    interpolate: "smooth",
                  });
                }}
                onDragStart={(event) => {
                  onNodeDragStart(event, {
                    id: table,
                    type: "table",
                    display_name: table,
                    show_details: false,
                    columns: schema[table],
                  });
                }}
              >
                <Table2Icon className={"text-primary size-5"} />
                <span className={"block text-xs"}>{table}</span>
              </div>
            ))}
          </ScrollArea>
        </ResizablePanel>
        <ResizableHandle className={"bg-border"} />
        <ResizablePanel
          order={1}
          defaultSize={Math.abs(100 - SIDEPANEL_DEFAULT_WIDTH)}
          className={"h-full"}
        >
          <div ref={queryBuilderContainerRef} className={"h-full w-full"}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              fitView={false}
              className={"h-full w-full"}
              nodeTypes={{
                table: TableNode,
                select: SelectNode,
              }}
              proOptions={{
                hideAttribution: true,
              }}
              onInit={(instance) => {
                setReactFlowInstance(instance);
              }}
              isValidConnection={(connection) =>
                isConnectionValid(connection, nodes, edges)
              }
              onNodeClick={(_, node) => nodeClickHandler(node.data)}
              onDragStart={(event) => canvasDragStartHandler(event)}
              onDragOver={canvasDragOverHandler}
              onDrop={canvasDropHandler}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={connectionHandler}
            >
              <Panel position="top-center">
                <div
                  className={
                    "border-border bg-background flex w-32 items-center justify-evenly rounded-lg border py-1 shadow-md"
                  }
                >
                  <Tooltip>
                    <TooltipTrigger asChild={true}>
                      <Button
                        variant={"secondary"}
                        size={"icon"}
                        className={"cursor-pointer bg-transparent"}
                        onClick={async () => {
                          const result = await database.executeQuery(
                            "fetch_all_identifiers",
                          );

                          if (result.ok) {
                            toast("Query executed successfully.");
                          } else {
                            toast(
                              `Query failed: ${String((result.error.raw as { error: string; status_code: string }).error)}`,
                            );
                          }
                        }}
                      >
                        <PlayIcon className={"size-6 fill-green-600"} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side={"bottom"}>
                      <p>Run Query</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild={true}>
                      <Button
                        variant={"secondary"}
                        size={"icon"}
                        className={"cursor-pointer bg-transparent"}
                        onClick={pushQueryHandler}
                      >
                        <SaveIcon className={"size-6 text-orange-600"} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side={"bottom"}>
                      <p>Save Query</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </Panel>
              <Background variant={BackgroundVariant.Dots} bgColor="#171717" />
            </ReactFlow>
          </div>
        </ResizablePanel>
        <ResizableHandle
          hidden={focusedNode === null}
          className={"bg-border"}
        />
        <ResizablePanel
          order={2}
          defaultSize={0}
          className={"h-full"}
          maxSize={SIDEPANEL_DEFAULT_WIDTH}
          collapsible={true}
          ref={filterPanelRef}
        >
          <div className={"text-foreground h-full w-full bg-stone-900"}>
            <div className={"flex items-center justify-between px-3 py-4"}>
              <div className={"flex items-center space-x-2"}>
                <h5 className={"font-medium"}>
                  {focusedNode?.type === "table" ? "Filters" : "Properties"}
                </h5>
              </div>
              <Button
                size={"icon"}
                variant={"secondary"}
                className={"cursor-pointer bg-transparent"}
                onClick={() => {
                  setFocusedNode(null);
                  filterPanelRef.current?.collapse();
                }}
              >
                <XMarkIcon />
              </Button>
            </div>
            <div className={"flex h-full w-full flex-col items-start"}>
              <ScrollArea
                className={
                  "bg-background text-foreground h-[92.5dvh] w-full px-2 pt-3 pb-20"
                }
              >
                {focusedNode?.type !== "table" ? (
                  <Fragment>
                    {FILTERS.map((filter) => (
                      <div key={filter.display_name}>
                        {filter.panelComponent(filter)}
                      </div>
                    ))}
                  </Fragment>
                ) : (
                  <Fragment>
                    {FILTERS.map((filter) => (
                      <div
                        key={filter.display_name}
                        draggable={true}
                        className={
                          "mb-3 flex h-10 cursor-pointer items-center space-x-2 rounded-lg border px-2 py-3 font-semibold transition-all duration-150 select-none hover:bg-stone-800"
                        }
                        onDragStart={(e) => {
                          onNodeDragStart(e, {
                            ...filter,
                            id: `${nanoid()}--#--filter:${filter.type}`,
                          });
                        }}
                      >
                        <FilterIcon className={"size-5 text-purple-400"} />
                        <span className={"block text-xs"}>
                          {filter.display_name}
                        </span>
                      </div>
                    ))}
                  </Fragment>
                )}
              </ScrollArea>
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

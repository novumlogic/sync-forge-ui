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
  type FilterNodeProperties,
  type NodeProperties,
  type TableNodeProperties,
} from "@type/node_properties";
import useDatabase from "@hooks/use_database";
import {
  addEdge,
  Background,
  BackgroundVariant,
  type Connection,
  type Edge,
  getOutgoers,
  Handle,
  type Node,
  type NodeProps,
  Panel,
  Position,
  ReactFlow,
  type ReactFlowInstance,
  reconnectEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "@xyflow/react";
import { FilterIcon, SaveIcon, Table2Icon } from "lucide-react";
import {
  Fragment,
  type JSX,
  useCallback,
  useEffect,
  useRef,
  useState,
  type DragEvent,
} from "react";
import type { ImperativePanelHandle } from "react-resizable-panels";
import { Button } from "@components/ui/button";
import { PlayIcon, XMarkIcon } from "@heroicons/react/24/solid";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@components/ui/tooltip";
import "@xyflow/react/dist/style.css";
import { toast } from "sonner";
import useDnD from "@hooks/use_dnd";
import { useQuery } from "@tanstack/react-query";
import { nanoid } from "nanoid";

const database: Database = new Database();
const SIDEPANEL_DEFAULT_WIDTH = 17;

function TableNode({
  data,
}: NodeProps<Node<TableNodeProperties>>): JSX.Element {
  return (
    <div
      className={
        "border-primary bg-primary-foreground flex items-center rounded-lg border"
      }
    >
      <Handle
        type="target"
        id={`${data.id}-target`}
        position={Position.Left}
        className={"!bg-primary !static !left-0 mt-2 !block !size-2.5"}
      />
      <div
        className={
          "flex w-full items-center justify-between space-x-3 px-1 py-2 font-medium"
        }
      >
        <Table2Icon className={"text-primary size-5"} />
        <span className={"block"}>{String(data.name)}</span>
      </div>
      <Handle
        type="source"
        id={`${data.id}-source`}
        position={Position.Right}
        className={"!bg-primary !static !right-0 mt-2 !block !size-2.5"}
      />
    </div>
  );
}

function FilterNode({
  data,
}: NodeProps<Node<FilterNodeProperties>>): JSX.Element {
  return (
    <div
      className={
        "flex items-center rounded-lg border border-purple-600 bg-purple-100"
      }
    >
      <Handle
        type="target"
        id={`${data.id}-target`}
        position={Position.Left}
        className={"!static !left-0 mt-2 !block !size-2.5 !bg-purple-600"}
      />
      <div
        className={
          "justify-betwee flex w-full items-center space-x-3 px-1 py-2 font-medium"
        }
      >
        <FilterIcon className={"size-5 text-purple-600"} />
        <span className={"block"}>{String(data.name)}</span>
      </div>
      <Handle
        type="source"
        id={`${data.id}-source`}
        position={Position.Right}
        className={"!static !right-0 mt-2 !block !size-2.5 !bg-purple-600"}
      />
    </div>
  );
}

// Filter definitions
const FILTERS: Array<NodeProperties> = [
  {
    id: "select",
    name: "select",
    type: "filter",
    extras: {},
    features: {
      allow_self_connection: false,
    },
  },
];

export default function Builder(): JSX.Element {
  const {
    store: { schema, graph },
    dispatch,
  } = useDatabase();

  const queryBuilderContainerRef = useRef<HTMLDivElement | null>(null);
  const filterPanelRef = useRef<ImperativePanelHandle>(null);
  const edgeReconnectSuccessful = useRef(true);

  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance<
    Node<NodeProperties>
  > | null>(null);
  const [focusedNode, setFocusedNode] = useState<Node<NodeProperties> | null>(
    null,
  );

  const [showFilterProperties, setShowFilterProperties] =
    useState<boolean>(false);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node<NodeProperties>>(
    [],
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const [nodeProperties, setNodeProperties] = useDnD();

  const { screenToFlowPosition, getNodes, getEdges } = useReactFlow();

  const onConnect = useCallback(
    (params: Connection) => {
      console.log(params);

      const sourceNode = getNodes().find((node) => node.id === params.source);
      const targetNode = getNodes().find((node) => node.id === params.target);

      if (sourceNode == null || targetNode == null) {
        return;
      }

      if (
        sourceNode.data.type === "table" &&
        targetNode.data.type === "table"
      ) {
        const sourceTable = sourceNode.data as TableNodeProperties;
        const targetTable = targetNode.data as TableNodeProperties;

        if (sourceTable.name === targetTable.name) {
          toast.error("Cannot connect a table to itself.");
          return;
        }

        if (
          graph
            ?.dependentsOf(sourceTable.name)
            .filter(({ table_name }) => table_name === targetTable.name)
            .length === 0
        ) {
          toast.error(
            `${sourceTable.name} has no direct dependency on ${targetTable.name}`,
          );
          return;
        }
      }

      if (
        sourceNode.data.type === "filter" &&
        targetNode.data.type === "filter"
      ) {
        const sourceFilter = sourceNode.data as FilterNodeProperties;
        const targetFilter = targetNode.data as FilterNodeProperties;

        if (
          sourceFilter.name === targetFilter.name &&
          !sourceFilter.features.allow_self_connection
        ) {
          toast.error("This filter does not allow self-connections.");
          return;
        }
      }

      if (
        sourceNode.data.type === "table" &&
        targetNode.data.type === "filter"
      ) {
        const sourceTable = sourceNode.data as TableNodeProperties;
        const targetFilter = targetNode.data as FilterNodeProperties;

        targetFilter.extras = {
          columns: sourceTable.columns.map((col) => col.column_name),
        };
      }

      console.log(getNodes());

      setEdges((eds) => {
        const sourceHasIncomingNode = eds.some(
          (e) => e.target === params.source,
        );

        if (!sourceHasIncomingNode && sourceNode.data.type === "filter") {
          toast.error("Filter nodes must have an incoming connection.");
          return eds;
        }

        return addEdge(params, eds);
      });
    },
    [getNodes, graph, setEdges],
  );

  const onNodeDragStart = useCallback(
    (event: DragEvent, nodeProps: NodeProperties) => {
      setNodeProperties(nodeProps);
      event.dataTransfer!.effectAllowed = "move";
    },
    [setNodeProperties],
  );

  function canvasDragStartHandler(event: DragEvent) {
    setNodeProperties(nodeProperties);
    event.dataTransfer.effectAllowed = "move";
  }

  const canvasDragOverHandler = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const canvasDropHandler = useCallback(
    (event: DragEvent) => {
      event.preventDefault();

      if (nodeProperties == null) {
        return;
      }

      const { left, top } = event.currentTarget.getBoundingClientRect();

      const position = screenToFlowPosition({
        x: event.clientX - left / 2,
        y: event.clientY - top / 2,
      });

      const newNode: Node<NodeProperties> = {
        id: nodeProperties.id,
        position: position,
        type: nodeProperties.type,
        data: nodeProperties,
      };

      setNodes((nodes) => [...nodes, newNode]);
    },
    [nodeProperties, screenToFlowPosition, setNodes],
  );

  const nodeClickHandler = useCallback((node: Node<NodeProperties>) => {
    setFocusedNode(node);

    setShowFilterProperties(node.data.type === "filter");

    if (!filterPanelRef.current?.isExpanded()) {
      filterPanelRef.current?.expand(SIDEPANEL_DEFAULT_WIDTH);
    }
  }, []);

  const isValidConnection = useCallback(
    (connection: Edge | Connection) => {
      const nodes = getNodes();
      const edges = getEdges();
      const target = nodes.find((node) => node.id === connection.target);
      const sourceId = connection.source;

      const hasCycle = (node: Node, visited = new Set<string>()) => {
        if (visited.has(node.id)) return false;

        visited.add(node.id);

        for (const outgoer of getOutgoers(node, nodes, edges)) {
          if (outgoer.id === sourceId) return true;
          if (hasCycle(outgoer, visited)) return true;
        }
      };

      if (target == null || target.id === sourceId) return false;
      return !hasCycle(target);
    },
    [getNodes, getEdges],
  );

  const pushQueryHandler = useCallback(async () => {
    if (reactFlowInstance === null) return;

    const graph = reactFlowInstance.toObject();

    const result = await database.saveQuery("fetch_all_identifiers", graph);

    if (result.ok) {
      toast("Query Saved.");
    } else {
      toast(
        `Query failed: ${String((result.error.raw as { error: string; status_code: string }).error)}`,
      );
    }
  }, [reactFlowInstance]);

  const onReconnectStart = useCallback(() => {
    edgeReconnectSuccessful.current = false;
  }, []);

  const onReconnect = useCallback(
    (oldEdge: Edge, newConnection: Connection) => {
      edgeReconnectSuccessful.current = true;
      setEdges((els) => reconnectEdge(oldEdge, newConnection, els));
    },
    [setEdges],
  );

  const onReconnectEnd = useCallback(
    (_: unknown, edge: Edge) => {
      if (!edgeReconnectSuccessful.current) {
        const targetFilter = getNodes().find((n) => n.id === edge.target);
        if (targetFilter?.data.type === "filter") {
          delete (targetFilter.data as FilterNodeProperties).extras["columns"];
        }
        setEdges((eds) => eds.filter((e) => e.id !== edge.id));
      }

      edgeReconnectSuccessful.current = true;
      console.log(getNodes());
    },
    [getNodes, setEdges],
  );

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

  useEffect(() => {
    if (schemaRequest.data !== undefined) {
      dispatch({
        type: "SET_SCHEMA",
        payload: { schema: schemaRequest.data },
      });
    }
  }, [schemaRequest.data, dispatch]);

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
                draggable={!getNodes().some((n) => n.id === table)}
                className={
                  "mb-3 flex h-10 cursor-pointer items-center space-x-2 rounded-lg border px-2 py-3 font-semibold transition-all duration-150 select-none hover:bg-stone-800"
                }
                onClick={() => {
                  if (getNodes().some((n) => n.id === table)) {
                    reactFlowInstance?.fitView({
                      nodes: [
                        {
                          id: table,
                        },
                      ],
                      duration: 1000,
                      interpolate: "smooth",
                    });
                  }
                }}
                onDragStart={(e) => {
                  onNodeDragStart(e, {
                    id: table,
                    name: table,
                    type: "table",
                    extras: {},
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
              onDragStart={(event) => canvasDragStartHandler(event)}
              onDragOver={canvasDragOverHandler}
              onDrop={canvasDropHandler}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onReconnect={onReconnect}
              onReconnectStart={onReconnectStart}
              onReconnectEnd={onReconnectEnd}
              isValidConnection={isValidConnection}
              nodeTypes={{
                table: TableNode,
                filter: FilterNode,
              }}
              proOptions={{
                hideAttribution: true,
              }}
              onInit={(instance) => {
                setReactFlowInstance(instance);
              }}
              onNodeClick={(_, node) => nodeClickHandler(node)}
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
                <h5 className={"font-mono font-medium"}>
                  {showFilterProperties ? `Properties` : "Filters"}
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
                {focusedNode?.data.type === "filter" && showFilterProperties ? (
                  <Fragment>
                    {(
                      Object.keys(focusedNode.data.extras) as Array<string>
                    ).map((key) => (
                      <div key={key} className={"flex items-center space-x-2"}>
                        <span className={"font-medium"}>{key}</span>
                      </div>
                    ))}
                  </Fragment>
                ) : (
                  <Fragment>
                    {FILTERS.map((filter) => (
                      <div
                        key={filter.name}
                        draggable={true}
                        className={
                          "mb-3 flex h-10 cursor-pointer items-center space-x-2 rounded-lg border px-2 py-3 font-semibold transition-all duration-150 select-none hover:bg-stone-800"
                        }
                        onDragStart={(e) => {
                          onNodeDragStart(e, {
                            ...filter,
                            id: `${nanoid()}--#--filter:select`,
                          });
                        }}
                      >
                        <FilterIcon className={"size-5 text-purple-400"} />
                        <span className={"block text-xs"}>{filter.name}</span>
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

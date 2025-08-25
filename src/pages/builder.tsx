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
import { type TableNodeProperties } from "@type/node_properties";
import useDatabase from "@hooks/use_database";
import {
  Background,
  BackgroundVariant,
  Handle,
  Panel,
  Position,
  ReactFlow,
  useEdgesState,
  useNodesState,
  type Edge,
  type Node,
  type NodeProps,
  type ReactFlowInstance,
} from "@xyflow/react";
import { SaveIcon, Table2Icon } from "lucide-react";
import {
  Fragment,
  useCallback,
  useEffect,
  useRef,
  useState,
  type JSX,
} from "react";
import Editor from "@monaco-editor/react";
import type { ImperativePanelHandle } from "react-resizable-panels";
import useDebounce from "@hooks/use_debounce";
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

const database: Database = new Database();
const SIDEPANEL_DEFAULT_WIDTH = 17;

function TableNode({
  data,
}: NodeProps<Node<TableNodeProperties>>): JSX.Element {
  return (
    <div
      className={
        "flex items-center rounded-lg border border-primary bg-primary-foreground"
      }
    >
      <Handle
        type="target"
        id={`${data.id}-target`}
        position={Position.Left}
        className={"!static !left-0 mt-2 !block !size-2.5 !bg-primary"}
      />
      <div
        className={
          "flex w-full items-center justify-between space-x-3 px-1 py-2 font-medium"
        }
      >
        <Table2Icon className={"size-5 text-primary"} />
        <span className={"block"}>{String(data.name)}</span>
      </div>
      <Handle
        type="source"
        id={`${data.id}-source`}
        position={Position.Right}
        className={"!static !right-0 mt-2 !block !size-2.5 !bg-primary"}
      />
    </div>
  );
}

export default function Builder(): JSX.Element {
  const { schema, dispatch } = useDatabase();

  const queryBuilderContainerRef = useRef<HTMLDivElement | null>(null);
  const editorPanelRef = useRef<ImperativePanelHandle>(null);

  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance<
    Node<TableNodeProperties, "table">
  > | null>(null);
  const [focusedNode, setFocusedNode] = useState<Node<
    TableNodeProperties,
    "table"
  > | null>(null);
  const [nodes, setNodes] = useNodesState<Node<TableNodeProperties, "table">>(
    [],
  );
  const [edges, setEdges] = useEdgesState<Edge>([]);
  const [editorContent, setEditorContent] = useState<string>("");

  const debouncedEditorContent = useDebounce(editorContent, 500);

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
    queryKey: ["fetch_all_identifiers"],
    refetchOnWindowFocus: false,
    enabled: Boolean(schema) || schemaRequest.isSuccess,
    queryFn: async () => {
      const result = await database.getQuery("fetch_all_identifiers");

      if (result.ok) {
        return result.value.payload;
      }

      const databaseSchema = schema ?? schemaRequest.data;

      if (databaseSchema === null || databaseSchema === undefined) {
        throw new Error("Schema not available to generate graph");
      }

      const { nodes, edges } = database.generateGraph(databaseSchema, {
        no_columns: true,
      });

      return {
        nodes: nodes,
        edges: edges,
        viewport: {
          x: 0,
          y: 0,
          zoom: 1,
        },
      };
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
    if (queryRequest.data !== undefined) {
      setNodes(queryRequest.data.nodes);
      setEdges(queryRequest.data.edges);
      reactFlowInstance?.setViewport(queryRequest.data.viewport);
    }
  }, [queryRequest.data, reactFlowInstance, setEdges, setNodes]);

  const nodeClickHandler = useCallback(
    (node: Node<TableNodeProperties, "table">) => {
      setFocusedNode(node);

      const query =
        "query" in node.data.extras
          ? String((node.data.extras as { query?: string }).query ?? "")
          : "";

      setEditorContent(query);

      if (!editorPanelRef.current?.isExpanded()) {
        editorPanelRef.current?.expand(2 * SIDEPANEL_DEFAULT_WIDTH);
      }
    },
    [],
  );

  const pushQueryHandler = useCallback(async () => {
    if (reactFlowInstance === null) return;

    const graph = reactFlowInstance.toObject();

    const result = await database.saveQuery("fetch_all_identifiers", graph);

    if (result.ok) {
      toast("Query Saved.");
    }
  }, [reactFlowInstance]);

  useEffect(() => {
    if (focusedNode === null) return;

    setNodes((previousNodes) =>
      previousNodes.map((node) => {
        if (node.id !== focusedNode.id) return node;

        const prevExtras = node.data.extras;
        const newData = {
          ...node.data,
          extras: {
            ...prevExtras,
            query: debouncedEditorContent,
          },
        };

        return {
          ...node,
          data: newData,
        };
      }),
    );
  }, [debouncedEditorContent, focusedNode, setNodes]);

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
              "flex w-full items-center justify-start px-3 pt-5 pb-3 font-bold bg-background text-foreground"
            }
          >
            <h3>Tables</h3>
          </div>
          <ScrollArea className={"h-[92.5dvh] w-full px-2 pt-3 pb-20 bg-background text-foreground"}>
            {(Object.keys(schema) as string[]).map((table) => (
              <div
                key={table}
                draggable={false}
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
              >
                <Table2Icon className={"size-5 text-primary"} />
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
                    "flex w-32 items-center justify-evenly rounded-lg border border-border bg-background py-1 shadow-md"
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
                            console.log(result.value.payload);
                          }else{
                            console.log(result.error.raw);
                            
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
              <Background variant={BackgroundVariant.Dots} bgColor="#171717"/>
            </ReactFlow>
          </div>
        </ResizablePanel>
        <ResizableHandle hidden={focusedNode === null} className={"bg-border"}/>
        <ResizablePanel
          order={2}
          defaultSize={0}
          className={"h-full"}
          maxSize={4 * SIDEPANEL_DEFAULT_WIDTH}
          collapsible={true}
          ref={editorPanelRef}
        >
          <div className={"h-full w-full bg-stone-900 text-foreground"}>
            <div className={"flex items-center justify-between px-3 py-4"}>
              <div className={"flex items-center space-x-2"}>
                <Table2Icon className={"size-5 text-primary"} />
                <h5 className={"font-mono font-medium"}>
                  {String(focusedNode?.data.name)}
                </h5>
              </div>
              <Button
                size={"icon"}
                variant={"secondary"}
                className={"cursor-pointer bg-transparent"}
                onClick={() => {
                  setFocusedNode(null);
                  editorPanelRef.current?.collapse();
                }}
              >
                <XMarkIcon />
              </Button>
            </div>
            <Editor
              className={"h-full w-ful"}
              theme={"vs-dark"}
              defaultLanguage={"sql"}
              value={editorContent}
              options={{
                minimap: {
                  enabled: false,
                },
              }}
              onChange={(value) => setEditorContent(value ?? "")}
            />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

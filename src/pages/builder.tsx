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
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps,
  type ReactFlowInstance,
} from "@xyflow/react";
import { Table2Icon } from "lucide-react";
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
import { XMarkIcon } from "@heroicons/react/24/solid";

const database: Database = new Database();
const SIDEPANEL_DEFAULT_WIDTH = 17;

function TableNode({
  data,
}: NodeProps<Node<TableNodeProperties>>): JSX.Element {
  return (
    <div
      className={
        "flex items-center rounded-lg border border-orange-600 bg-orange-100"
      }
    >
      <Handle
        type="target"
        id={`${data.id}-target`}
        position={Position.Left}
        className={"!static !left-0 mt-2 !block !size-2.5 !bg-orange-600"}
      />
      <div
        className={
          "justify-betwee flex w-full items-center space-x-3 px-1 py-2 font-medium"
        }
      >
        <Table2Icon className={"size-5 text-orange-600"} />
        <span className={"block"}>{String(data.name)}</span>
      </div>
      <Handle
        type="source"
        id={`${data.id}-source`}
        position={Position.Right}
        className={"!static !right-0 mt-2 !block !size-2.5 !bg-orange-600"}
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
  const [nodes, setNodes] = useState<Array<Node<TableNodeProperties, "table">>>(
    [],
  );
  const [edges, setEdges] = useState<Array<Edge>>([]);
  const [editorContent, setEditorContent] = useState<string>("");

  const debouncedEditorContent = useDebounce(editorContent, 500);

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
  }, [debouncedEditorContent, focusedNode]);

  useEffect(() => {
    if (focusedNode == null) {
      editorPanelRef.current?.collapse();
    }
  }, [focusedNode]);

  useEffect(() => {
    if (schema !== null) {
      return;
    }
    database.getDatabaseSchema().then((result) => {
      if (result.ok) {
        dispatch({
          type: "SET_SCHEMA",
          payload: {
            schema: result.value.payload,
          },
        });
      } else {
        console.error(result.error);
      }
    });
  });

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

  useEffect(() => {
    if (schema === null) return;

    const graph = database.generateGraph(schema, {
      no_columns: true,
    });

    setNodes(graph.nodes);
    setEdges(graph.edges);
  }, [schema]);

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
              "flex w-full items-center justify-start px-3 pt-5 pb-3 font-bold"
            }
          >
            <h3>Tables</h3>
          </div>
          <ScrollArea className={"h-[92.5dvh] w-full px-2 py-3"}>
            {(Object.keys(schema) as string[]).map((table) => (
              <div
                key={table}
                draggable={false}
                className={
                  "mb-3 flex h-10 cursor-pointer items-center space-x-2 rounded-lg border px-2 py-3 font-semibold transition-all duration-150 select-none hover:bg-gray-100"
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
                <Table2Icon className={"size-5 text-orange-600"} />
                <span className={"block text-xs"}>{table}</span>
              </div>
            ))}
          </ScrollArea>
        </ResizablePanel>
        <ResizableHandle />
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
              <Background variant={BackgroundVariant.Dots} />
            </ReactFlow>
          </div>
        </ResizablePanel>
        <ResizableHandle hidden={focusedNode === null} />
        <ResizablePanel
          order={2}
          defaultSize={0}
          className={"h-full"}
          maxSize={4 * SIDEPANEL_DEFAULT_WIDTH}
          collapsible={true}
          ref={editorPanelRef}
        >
          <div className={"h-full w-full"}>
            <div className={"flex items-center justify-between px-3 py-4"}>
              <div className={"flex items-center space-x-2"}>
                <Table2Icon className={"size-5 text-orange-600"} />
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
              className={"h-full w-full"}
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

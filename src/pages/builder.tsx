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
import useDnD from "@hooks/use_dnd";
import {
  addEdge,
  Background,
  Handle,
  Position,
  ReactFlow,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type Edge,
  type Node,
  type NodeProps,
  type ReactFlowInstance,
} from "@xyflow/react";
import { Table2Icon } from "lucide-react";
import { nanoid } from "nanoid";
import {
  Fragment,
  useEffect,
  useRef,
  useState,
  type JSX,
  type DragEvent,
  useCallback,
} from "react";
import { FunnelIcon } from "@heroicons/react/24/outline";

const database: Database = new Database();
const SIDEPANEL_DEFAULT_WIDTH = 17;

const FILTERS: Record<string, NodeProperties> = {
  select: {
    id: "select",
    type: "filter",
    name: "select",
    extras: {},
  },
};

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
        <FunnelIcon className={"size-5 text-purple-600"} />
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

export default function Builder(): JSX.Element {
  const queryBuilderContainerRef = useRef<HTMLDivElement | null>(null);
  const [reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance | null>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const { schema, dispatch } = useDatabase();
  const [nodeProperties, setNodeProperties] = useDnD();
  const { screenToFlowPosition } = useReactFlow();

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  function tableNodeDragStartHandler(
    event: DragEvent,
    nodeProperties: NodeProperties,
  ) {
    setNodeProperties(nodeProperties);
    event.dataTransfer.effectAllowed = "move";
  }

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

      const newNode: Node = {
        id: nodeProperties.id,
        position: position,
        type: nodeProperties.type,
        data: nodeProperties,
      };

      setNodes((nodes) => nodes.concat(newNode));
    },
    [screenToFlowPosition, nodeProperties, setNodes],
  );

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

  if (schema === null) {
    return <Fragment />;
  }

  return (
    <div className="h-[92.5dvh]">
      <ResizablePanelGroup direction={"horizontal"} className={"h-full"}>
        <ResizablePanel
          defaultSize={SIDEPANEL_DEFAULT_WIDTH}
          className={"h-full"}
          maxSize={SIDEPANEL_DEFAULT_WIDTH}
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
                draggable={true}
                className={
                  "mb-3 flex h-10 cursor-pointer items-center space-x-2 rounded-lg border px-2 py-3 font-semibold transition-all duration-150 select-none hover:bg-gray-100"
                }
                onDragStart={(event) =>
                  tableNodeDragStartHandler(event, {
                    id: `${nanoid()}--#--${table}`,
                    type: "table",
                    name: table,
                    columns: schema[table],
                    extras: {},
                  })
                }
              >
                <Table2Icon className={"size-5 text-orange-600"} />
                <span className={"block text-xs"}>{table}</span>
              </div>
            ))}
          </ScrollArea>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel
          defaultSize={Math.abs(100 - 2 * SIDEPANEL_DEFAULT_WIDTH)}
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
            >
              <Background />
            </ReactFlow>
          </div>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel
          defaultSize={SIDEPANEL_DEFAULT_WIDTH}
          className={"h-full"}
          maxSize={SIDEPANEL_DEFAULT_WIDTH}
        >
          <div
            className={
              "flex w-full items-center justify-start px-3 pt-5 pb-3 font-bold"
            }
          >
            <h3>Filters</h3>
          </div>
          <ScrollArea className={"h-[92.5dvh] w-full px-2 py-3"}>
            {(Object.keys(FILTERS) as string[]).map((filterName) => (
              <div
                key={filterName}
                draggable={true}
                className={
                  "mb-3 flex h-10 cursor-pointer items-center space-x-2 rounded-lg border px-2 py-3 font-semibold transition-all duration-150 select-none hover:bg-gray-100"
                }
                onDragStart={(event) =>
                  tableNodeDragStartHandler(event, {
                    ...FILTERS[filterName],
                    id: `${nanoid()}--#--filter:select`,
                  })
                }
              >
                <FunnelIcon className={"size-5 text-purple-600"} />
                <span className={"block text-xs"}>{filterName}</span>
              </div>
            ))}
          </ScrollArea>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

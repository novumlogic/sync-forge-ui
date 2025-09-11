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

import { type AnyNodeProps, type BuilderNode } from "@type/node_properties";
import {
  Background,
  BackgroundVariant,
  ReactFlow,
  type Connection,
  type ReactFlowInstance,
} from "@xyflow/react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type JSX,
  type DragEvent,
} from "react";
import "@xyflow/react/dist/style.css";
import { TableNode, SelectNode } from "@components/nodes";
import useDnD from "@hooks/use_dnd";
import { isConnectionValid } from "@lib/validators";
import useBuilder from "@hooks/use_builder";
import useDatabase from "@hooks/use_database";
import useFocus from "@hooks/use_focus";

interface BuilderProps {
  onNodeClick: (node: AnyNodeProps) => void;
}

export default function Builder({
  onNodeClick,
}: Readonly<BuilderProps>): JSX.Element {
  const { nodes, edges, dispatch } = useBuilder();

  const {
    store: { schema, graph },
  } = useDatabase({
    initialized: true,
  });

  const [nodeProperties, setNodeProperties] = useDnD();

  const { focusedNodeProps, dispatch: focusDispatch } = useFocus();

  const queryBuilderContainerRef = useRef<HTMLDivElement | null>(null);

  const [reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance<BuilderNode> | null>(null);

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

  const connectionHandler = useCallback(
    (connection: Connection) => {
      dispatch({
        type: "ADD_EDGE",
        payload: {
          connection: connection,
          schema: schema,
          focusedNodeId: focusedNodeProps?.id ?? null,
        },
      });
    },
    [dispatch, focusedNodeProps, schema],
  );

  const canvasDropHandler = useCallback(
    (event: DragEvent) => {
      event.preventDefault();

      if (nodeProperties === null || reactFlowInstance === null) return;

      const { left, top } = event.currentTarget.getBoundingClientRect();

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX - left / 2,
        y: event.clientY - top / 2,
      });

      const newNode: BuilderNode = {
        id: nodeProperties.props.id,
        position,
        type: nodeProperties.type,
        data: nodeProperties.props,
      } as BuilderNode;

      dispatch({
        type: "ADD_NODE",
        payload: {
          node: newNode,
        },
      });
    },
    [dispatch, nodeProperties, reactFlowInstance],
  );

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
    document.addEventListener("focusedNodeMutation", (event) => {
      setTimeout(() => {
        focusDispatch({
          type: "FOCUS_NODE",
          payload: {
            properties: (event as CustomEvent).detail as AnyNodeProps,
          },
        });
      }, 10);
    });
  }, [dispatch, focusDispatch]);

  return (
    <div
      ref={queryBuilderContainerRef}
      className={"h-full w-full overflow-hidden"}
    >
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
          dispatch({
            type: "SET_INSTANCE",
            payload: {
              instace: instance,
            },
          });
        }}
        isValidConnection={(connection) =>
          isConnectionValid(connection, nodes, edges, graph)
        }
        onNodeClick={(_, node) => onNodeClick(node.data)}
        onDragStart={(event) => canvasDragStartHandler(event)}
        onDragOver={canvasDragOverHandler}
        onDrop={canvasDropHandler}
        onNodesChange={(changes) => {
          dispatch({
            type: "UPDATE_NODE",
            payload: {
              changes: changes,
            },
          });
        }}
        onEdgesChange={(changes) => {
          dispatch({
            type: "UPDATE_EDGE",
            payload: {
              changes: changes,
            },
          });
        }}
        onConnect={connectionHandler}
      >
        {/* <Panel position="top-center">
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
                  onClick={}
                >
                  <SaveIcon className={"size-6 text-orange-600"} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side={"bottom"}>
                <p>Save Query</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </Panel> */}
        <Background variant={BackgroundVariant.Dots} bgColor="#171717" />
      </ReactFlow>
    </div>
  );
}

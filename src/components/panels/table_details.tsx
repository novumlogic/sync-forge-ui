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

import { useCallback, type JSX, type DragEvent, Fragment, memo } from "react";
import TableDetail from "../table_detail";
import useDnD from "@hooks/use_dnd";
import type {
  DragNodePayload,
  NodePropertiesMap,
} from "@type/node_properties";
import { ScrollArea } from "@components/ui/scroll_area";
import useDatabase from "@hooks/use_database";
import useBuilder from "@hooks/use_builder";

function TableDetailsPanel(): JSX.Element {
  const [, setNodeProperties] = useDnD();
  const {
    store: { schema },
  } = useDatabase({ initialized: true });

  const { nodes, instance } = useBuilder();

  const nodeDragHandler: <K extends keyof NodePropertiesMap>(
    event: DragEvent<HTMLDivElement>,
    props: NodePropertiesMap[K] & { type: K },
  ) => void = useCallback(
    (event, props) => {
      const payload = {
        type: props.type,
        props,
      } as DragNodePayload<typeof props.type>;

      setNodeProperties(payload);
      event.dataTransfer!.effectAllowed = "move";
    },
    [setNodeProperties],
  );

  const nodeExists = useCallback(
    (table: string): boolean => {
      return nodes.some((n) => n.id === table);
    },
    [nodes],
  );

  const nodeClickHandler = useCallback(
    (table: string) => {
      if (!nodeExists(table)) return;
      instance!.fitView({
        nodes: [
          {
            id: table,
          },
        ],
        duration: 1000,
        interpolate: "smooth",
      });
    },
    [instance, nodeExists],
  );

  return (
    <Fragment>
      <div
        className={
          "bg-background text-foreground flex w-full items-center justify-start px-3 pt-5 font-bold"
        }
      >
        <h3>Tables</h3>
      </div>
      <ScrollArea
        className={"bg-background text-foreground h-full w-full px-2 pt-3"}
      >
        <div className={"flex flex-col gap-2 pb-15"}>
          {Object.keys(schema).map((tableName) => (
            <TableDetail
              key={tableName}
              table={tableName}
              onNodeDragStart={
                nodeDragHandler as (
                  event: DragEvent<HTMLDivElement>,
                  props: NodePropertiesMap[keyof NodePropertiesMap] & {
                    type: keyof NodePropertiesMap;
                  },
                ) => void
              }
              onClick={nodeClickHandler}
              draggable={!nodeExists(tableName)}
            />
          ))}
        </div>
      </ScrollArea>
    </Fragment>
  );
}

export default memo(TableDetailsPanel);
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

import type { NodePropertiesMap } from "@type/node_properties";
import { Table2Icon } from "lucide-react";
import { type JSX, type DragEvent } from "react";

interface TablesDetailProps {
  draggable: boolean;
  table: string;
  onNodeDragStart: <K extends keyof NodePropertiesMap>(
    event: DragEvent<HTMLDivElement>,
    props: NodePropertiesMap[K] & { type: K },
  ) => void;
  onClick: (table: string) => void;
}

export default function TableDetail({
  table,
  onNodeDragStart,
  onClick,
  draggable,
}: Readonly<TablesDetailProps>): JSX.Element {
  return (
    <div
      key={table}
      draggable={draggable}
      className={
        "flex h-10 cursor-pointer items-center space-x-2 rounded-lg border px-2 py-3 font-semibold transition-all duration-150 select-none hover:bg-stone-800"
      }
      onClick={() => onClick(table)}
      onDragStart={(event) => {
        onNodeDragStart(event, {
          id: table,
          type: "table",
          display_name: table,
          show_details: false,
        });
      }}
    >
      <Table2Icon className={"text-primary size-5"} />
      <span className={"block text-xs"}>{table}</span>
    </div>
  );
}

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

import { Handle, type NodeProps, Position } from "@xyflow/react";
import { Fragment, type JSX } from "react";
import type { TableNode } from "@/type/table_node";
import { KeyIcon } from "@heroicons/react/24/solid";
import { CircleStackIcon, FingerPrintIcon } from "@heroicons/react/24/outline";

export default function TableNode({ data }: NodeProps<TableNode>): JSX.Element {
  return (
    <div className="rounded-lg border bg-white">
      <div className="bg-primary rounded-t-md px-2 py-3 font-semibold text-white flex items-center space-x-1">
        <CircleStackIcon className={"size-6"} />
        <h5>{data.tableName}</h5>
      </div>
      <div className="flex flex-col gap-y-2 pt-4 pb-2">
        {data.columns.map((c) => (
          <div
            key={c.column_name}
            className="flex items-center justify-between"
          >
            <Handle
              type="target"
              id={`${data.tableName}.${c.column_name}`}
              position={Position.Left}
              style={{
                marginTop: 7,
                left: 0,
                position: "static",
                display: "block",
                visibility: "hidden",
              }}
            />
            <div
              className={"flex w-full items-start justify-between space-x-5"}
            >
              <div className={"flex items-center space-x-2 pl-1"}>
                <div>
                  {c.is_primary_key ? (
                    <Fragment>
                      <KeyIcon className={"size-4 fill-yellow-400"} />
                    </Fragment>
                  ) : c.is_unique ? (
                    <Fragment>
                      <FingerPrintIcon className={"size-4 text-purple-700"} />
                    </Fragment>
                  ) : c.foreign_keys.length > 0 ? (
                    <Fragment>
                      <KeyIcon className={"size-4 fill-red-400"} />
                    </Fragment>
                  ) : (
                    <div className={"size-4"} />
                  )}
                </div>
                <span className={"block"}>{c.column_name}</span>
              </div>
              <pre className={"block text-xs text-gray-400"}>{c.data_type}</pre>
            </div>
            <Handle
              type="source"
              id={`${data.tableName}.${c.column_name}`}
              position={Position.Right}
              style={{
                marginTop: -2,
                right: 0,
                position: "static",
                display: "block",
                visibility: "hidden",
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

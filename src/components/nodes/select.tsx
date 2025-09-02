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

import type { SelectNodeProperties } from "@type/node_properties";
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { FilterIcon } from "lucide-react";
import type { JSX } from "react";

export default function SelectNode({
  data,
}: NodeProps<
  Node<SelectNodeProperties>
>): JSX.Element {
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
        <span className={"block"}>{String(data.type)}</span>
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




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

import useDnD from "@hooks/use_dnd";
import type {
  DragNodePayload,
  FilterDefinition,
  NodePropertiesMap,
} from "@type/node_properties";
import { FilterIcon } from "lucide-react";
import { nanoid } from "nanoid";
import { Fragment, memo, useCallback, type JSX, type DragEvent } from "react";

interface FiltersPanelProps {
  filters: Array<FilterDefinition>;
}

function FiltersPanel({ filters }: Readonly<FiltersPanelProps>): JSX.Element {
  const [, setNodeProperties] = useDnD();

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

  return (
    <Fragment>
      {filters.map((filter) => (
        <div
          key={filter.display_name}
          draggable={true}
          className={
            "mb-3 flex h-10 cursor-pointer items-center space-x-2 rounded-lg border px-2 py-3 font-semibold transition-all duration-150 select-none hover:bg-stone-800"
          }
          onDragStart={(e) => {
            nodeDragHandler(e, {
              ...filter,
              id: `${nanoid()}--#--filter:${filter.type}`,
            });
          }}
        >
          <FilterIcon className={"size-5 text-purple-400"} />
          <span className={"block text-xs"}>{filter.display_name}</span>
        </div>
      ))}
    </Fragment>
  );
}

export default memo(FiltersPanel);

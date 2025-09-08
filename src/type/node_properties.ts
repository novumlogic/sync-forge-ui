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

import type { Node } from "@xyflow/react";
import type { ReactNode } from "react";

export type SqlFilter<Columns extends string> = {
  clause: "AND" | "OR";
  on: {
    column: Columns;
    operator: "equals" | "not_equals" | "in" | "not_in" | "like";
    value: string | number | boolean | Array<string | number | boolean>;
  };
};

type ColumnsToSelected<T extends readonly string[]> = {
  [K in T[number]]: { selected: boolean };
};

export type SelectNodeProperties<
  Cols extends readonly string[] = string[]
> = {
  type: "select";
  id: string;
  table: string;
  display_name: string;
  columns: ColumnsToSelected<Cols>;
  filters: Array<SqlFilter<Cols[number]>>;
  features: {
    allow_self_connection: boolean;
  };
};

export type TableNodeProperties = {
  type: "table";
  id: string;
  display_name: string;
  show_details: boolean;
};

export interface NodePropertiesMap {
  table: TableNodeProperties;
  select: SelectNodeProperties;
}

export type AnyNodeProps = NodePropertiesMap[keyof NodePropertiesMap];

export type NodeProperties<K extends keyof NodePropertiesMap> =
  NodePropertiesMap[K];

export type BuilderNode = {
  [K in keyof NodePropertiesMap]: Node<NodePropertiesMap[K]>;
}[keyof NodePropertiesMap];

export type DragNodePayload<
  K extends keyof NodePropertiesMap = keyof NodePropertiesMap,
> = {
  type: K;
  props: NodePropertiesMap[K];
};

export type FilterNodeType = Exclude<keyof NodePropertiesMap, "table">;

export type FilterDefinition = {
  [K in Exclude<keyof NodePropertiesMap, "table">]: NodePropertiesMap[K] & {
    type: K;
    panelComponent: (props: NodePropertiesMap[K]) => ReactNode;
  };
}[Exclude<keyof NodePropertiesMap, "table">];

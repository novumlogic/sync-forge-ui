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

import type TableColumn from "@dto/table_column";
import type { Node } from "@xyflow/react";

export type SqlFilter<Columns extends string> = {
  clause: "AND" | "OR";
  on: {
    column: Columns;
    operator: "equals" | "not_equals" | "in" | "not_in" | "like";
    value: string | number | boolean | Array<string | number | boolean>;
  };
};

export type SelectNodeProperties<
  SelectedColumns extends Record<string, { selected: boolean }>,
> = {
  id: string;
  table: string;
  columns: SelectedColumns;
  filters: Array<SqlFilter<Extract<keyof SelectedColumns, string>>>;
  features: {
    allow_self_connection: boolean;
  };
};

export function createSelectNode<
  SelectColumns extends Record<string, { selected: boolean }>,
>(
  node: Omit<Node<SelectNodeProperties<SelectColumns>>, "type"> & { type: "select" },
) {
  return node as Node<SelectNodeProperties<SelectColumns>> & { type: "select" };
}

export function isSelectNode(node: BuilderNode): node is Node<
  SelectNodeProperties<Record<string, { selected: boolean }>>
> & {
  type: "select";
} {
  return node.type === "select";
}

export type TableNodeProperties = {
  id:string;
  name: string;
  show_details:boolean;
  columns: Array<TableColumn>;
};

export function createTableNode(
  node: Omit<Node<TableNodeProperties>, "type"> & { type: "table" },
) {
  return node as Node<TableNodeProperties> & { type: "table" };
}

export function isTableNode(
  node: BuilderNode,
): node is Node<TableNodeProperties> & { type: "table" } {
  return node.type === "table";
}

export interface NodeProperties<
  SC extends Record<string, { selected: boolean }> = Record<
    string,
    { selected: boolean }
  >,
> {
  table: TableNodeProperties;
  select: SelectNodeProperties<SC>;
}

export type BuilderNode<
  SC extends Record<string, { selected: boolean }> = Record<
    string,
    { selected: boolean }
  >,
  K extends keyof NodeProperties<SC> = keyof NodeProperties<SC>,
> = {
  [T in K]: Node<NodeProperties<SC>[T]> & { type: T };
}[K];

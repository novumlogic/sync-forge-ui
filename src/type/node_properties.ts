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

/**
 * Represents the generic properties of a node in the graph.
 */
type GenericNodeProperties = {
  /**
   * Unique identifier for the node.
   */
  id: string;

  /**
   * Display name of the node.
   */
  name: string;

  /**
   * Additional properties or metadata for the node.
   */
  extras: Record<string, unknown>;
};

/**
 * Represents the properties of a table node in the graph.
 */
type TableNodeProperties = {
  /**
   * The type of node, always "table" for table nodes.
   */
  type: "table";

  /**
   * The columns belonging to the table node.
   */
  columns: Array<TableColumn>;
} & GenericNodeProperties;

/**
 * Represents the properties of a filter node in the graph.
 */
type FilterNodeProperties = {
  /**
   * The type of node, always "filter" for filter nodes.
   */
  type: "filter";
  features: {
    allow_self_connection: boolean;
  };
} & GenericNodeProperties;

/**
 * Represents the properties of a node in the graph.
 */
type NodeProperties = TableNodeProperties | FilterNodeProperties;

export type { NodeProperties, TableNodeProperties, FilterNodeProperties };

export type SqlFilter<Columns extends string> = {
  clause: "AND" | "OR";
  on: {
    column: Columns;
    operator: "equals" | "not_equals" | "in" | "not_in" | "like";
    value: string | number | boolean | Array<string | number | boolean>;
  };
};

export type SelectNodeProps<
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
  node: Omit<Node<SelectNodeProps<SelectColumns>>, "type"> & { type: "select" },
) {
  return node as Node<SelectNodeProps<SelectColumns>> & { type: "select" };
}

export function isSelectNode(node: GraphNode): node is Node<
  SelectNodeProps<Record<string, { selected: boolean }>>
> & {
  type: "select";
} {
  return node.type === "select";
}

export type TableNodeProps = {
  name: string;
  columns: Array<TableColumn>;
};

export function createTableNode(
  node: Omit<Node<TableNodeProps>, "type"> & { type: "table" },
) {
  return node as Node<TableNodeProps> & { type: "table" };
}

export function isTableNode(
  node: GraphNode,
): node is Node<TableNodeProps> & { type: "table" } {
  return node.type === "table";
}

//------------------------------------------------------//

export interface NodeProps<
  SC extends Record<string, { selected: boolean }> = Record<
    string,
    { selected: boolean }
  >,
> {
  table: TableNodeProps;
  select: SelectNodeProps<SC>;
}

export type GraphNode<
  SC extends Record<string, { selected: boolean }> = Record<
    string,
    { selected: boolean }
  >,
  K extends keyof NodeProps<SC> = keyof NodeProps<SC>,
> = {
  [T in K]: Node<NodeProps<SC>[T]> & { type: T };
}[K];

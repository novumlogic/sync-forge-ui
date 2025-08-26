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
} & GenericNodeProperties;

/**
 * Represents the properties of a node in the graph.
 */
type NodeProperties = TableNodeProperties | FilterNodeProperties;

export type { NodeProperties, TableNodeProperties, FilterNodeProperties };

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
 * Represents a directed graph of dependencies between tables.
 * Edges go from parent -> child and are labeled with the column name that references the parent.
 */
export class DependencyGraph {
  private nodes: string[] = []; // index -> table name
  private nodeMap: Map<string, number> = new Map(); // table name -> index
  // adjacency list: fromIndex -> array of { to: index, column: string }
  private edges: Map<number, Array<{ to: number; column: string }>> = new Map();

  /**
   * Create a new DependencyGraph from a schema.
   * Accepts either a plain object record { [tableName]: TableColumn[] } or a Map<string, TableColumn[]>.
   */
  constructor(
    schema: Record<string, TableColumn[]> | Map<string, TableColumn[]>,
  ) {
    // Step 1: register nodes
    if (schema instanceof Map) {
      for (const table of schema.keys()) {
        this.addNode(table);
      }
    } else {
      for (const table of Object.keys(schema)) {
        this.addNode(table);
      }
    }

    // Step 2: add edges for foreign keys
    const iter =
      schema instanceof Map ? schema.entries() : Object.entries(schema);
    for (const [table, columns] of iter) {
      const childIdx = this.nodeMap.get(table);
      if (childIdx === undefined) continue; // defensive
      if (!Array.isArray(columns)) continue;

      for (const col of columns) {
        const fks = col.foreign_keys ?? [];
        for (const fk of fks) {
          const parentIdx = this.nodeMap.get(fk.table_name);
          if (parentIdx !== undefined) {
            this.addEdge(parentIdx, childIdx, col.column_name);
          }
        }
      }
    }
  }

  /** Add a node if not present and return its index */
  private addNode(tableName: string): number {
    const existing = this.nodeMap.get(tableName);
    if (existing !== undefined) return existing;
    const idx = this.nodes.length;
    this.nodes.push(tableName);
    this.nodeMap.set(tableName, idx);
    this.edges.set(idx, []);
    return idx;
  }

  /** Add a directed edge parent -> child with an edge label (column name) */
  private addEdge(
    parentIdx: number,
    childIdx: number,
    columnName: string,
  ): void {
    const list = this.edges.get(parentIdx);
    if (!list)
      this.edges.set(parentIdx, [{ to: childIdx, column: columnName }]);
    else list.push({ to: childIdx, column: columnName });
  }

  /**
   * Returns a list of tables that depend on `targetTable`.
   * Each tuple contains [dependentTableName, referencingColumnName].
   *
   * Example: If `orders.user_id` references `users.id`, then dependentsOf('users')
   * will include ['orders', 'user_id'].
   */
  public dependentsOf(targetTable: string): Array<{
    table_name: string;
    column: string;
  }> {
    const result: Array<{
      table_name: string;
      column: string;
    }> = [];
    const targetIdx = this.nodeMap.get(targetTable);
    if (targetIdx === undefined) return result;

    const outgoing = this.edges.get(targetIdx) ?? [];
    for (const edge of outgoing) {
      const depName = this.nodes[edge.to];
      result.push({ table_name: depName, column: edge.column });
    }
    return result;
  }

  /** Optional helper: return all table names in the graph */
  public allTables(): string[] {
    return [...this.nodes];
  }
}
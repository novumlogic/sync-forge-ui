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

import HttpService from "@/services/http_service";
import type TableColumn from "@/dto/table_column";
import { type Edge, type Node, Position } from "@xyflow/react";
import type { DatabaseSchema } from "@/type/database_schema";
import dagre from "@dagrejs/dagre";
import { API_BASE_URL } from "@/constants.ts";
import type { TableNodeProperties } from "@/type/node_properties";

export default class Database {
  private http: HttpService;
  private NODE_BUFFER_X = 32;
  private NODE_BUFFER_Y = 32;

  constructor() {
    this.http = new HttpService(API_BASE_URL);
  }

  public async getDatabaseSchema() {
    return this.http.get<Record<string, Array<TableColumn>>>(
      "/database-schema",
    );
  }

  public async downloadDatabase() {
    return this.http.get<ArrayBuffer>("/sync-database", {
      requestTimeout: 120000,
      responseType: "arraybuffer",
    });
  }

  public generateGraph(schema: DatabaseSchema): {
    nodes: Array<Node<TableNodeProperties, "table">>;
    edges: Edge[];
  } {
    const nodes: Array<Node<TableNodeProperties, "table">> = [];
    const edges: Edge[] = [];

    for (const [tableName, columns] of Object.entries(schema)) {
      nodes.push({
        id: tableName,
        type: "table",
        position: { x: 0, y: 0 },
        data: {
          id: tableName,
          name: tableName,
          type: "table",
          columns: columns,
          extras: {},
        } satisfies TableNodeProperties,
      });

      for (const col of columns) {
        for (const fk of col.foreign_keys || []) {
          edges.push({
            id: fk.constraint_name,
            source: tableName,
            target: fk.table_name,
            sourceHandle: `${tableName}.${col.column_name}-source`,
            targetHandle: `${fk.table_name}.${fk.column_name}-target`,
            type: "smoothstep",
            animated: true,
          });
        }
      }
    }

    return this.createGraphLayout<TableNodeProperties, "table">(nodes, edges, "LR");
  }

  private createGraphLayout<
    D extends TableNodeProperties,
    T extends string | undefined = string,
  >(
    nodes: ReadonlyArray<Node<D, T>>,
    edges: ReadonlyArray<Edge>,
    direction: "LR" | "RL" | "TB" | "BT" = "LR",
  ): { nodes: Node<D, T>[]; edges: Edge[] } {
    const g = new dagre.graphlib.Graph({ multigraph: false, compound: false });
    g.setGraph({
      rankdir: direction,
      nodesep: 120,
      ranksep: 160,
      edgesep: 24,
      marginx: 48,
      marginy: 48,
      ranker: "network-simplex",
    });
    g.setDefaultEdgeLabel(() => ({}));

    nodes.forEach((n) => {
      const { width, height } = this.tableNodeSize(n.data.columns);
      g.setNode(n.id, {
        width: width + this.NODE_BUFFER_X,
        height: height + this.NODE_BUFFER_Y,
      });
    });

    edges.forEach((e) => g.setEdge(e.source, e.target));

    dagre.layout(g);

    const isHorizontal = direction === "LR" || direction === "RL";
    const sourcePosition: Position = isHorizontal
      ? Position.Right
      : Position.Bottom;
    const targetPosition: Position = isHorizontal
      ? Position.Left
      : Position.Top;

    const outNodes: Node<D, T>[] = nodes.map((n) => {
      const { x, y, width, height } = g.node(n.id);
      return {
        ...n,
        position: { x: x - width / 2, y: y - height / 2 },
        sourcePosition,
        targetPosition,
      };
    });

    return { nodes: outNodes, edges: [...edges] };
  }

  private tableNodeSize(cols: ReadonlyArray<TableColumn>): {
    width: number;
    height: number;
  } {
    const HEADER_H = 28;
    const ROW_H = 24;
    const PAD_V = 12;
    const NODE_W = 260;
    return {
      width: NODE_W,
      height: HEADER_H + PAD_V * 2 + cols.length * ROW_H,
    };
  }
}

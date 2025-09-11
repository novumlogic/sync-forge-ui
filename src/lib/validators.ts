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

import type { BuilderNode } from "@type/node_properties";
import type { Connection, Edge } from "@xyflow/react";
import type { DependencyGraph } from "./dependency_graph";

export function isConnectionValid(
  connection: Edge | Connection,
  nodes: Array<BuilderNode>,
  edges: Array<Edge>,
  dependency_graph: DependencyGraph | null,
): boolean {
  if (dependency_graph === null) return false;

  if (cycleExists(connection, nodes, edges)) {
    return false;
  }

  const sourceNode = nodes.find((node) => node.id === connection.source);
  const targetNode = nodes.find((node) => node.id === connection.target);

  if (
    sourceNode === null ||
    targetNode === null ||
    sourceNode === undefined ||
    targetNode === undefined
  ) {
    return false;
  }

  if (sourceNode.data.type === "table" && targetNode.data.type === "table") {
    const sourceTable = sourceNode.data;
    const targetTable = targetNode.data;

    if (sourceTable.id === targetTable.id) {
      return false;
    }

    if (
      dependency_graph
        .dependentsOf(sourceTable.id)
        .filter((dependent) => dependent.table_name === targetTable.id)
        .length === 0
    ) {
      return false;
    }
  }

  if (sourceNode.data.type === "select" && targetNode.data.type === "select") {
    const sourceSelect = sourceNode.data;
    if (Object.keys(sourceSelect.columns).length === 0) {
      return false;
    }
  }

  if (sourceNode.data.type === "table" && targetNode.data.type === "select") {
    const targetSelect = targetNode.data;
    if (
      Object.keys(targetSelect.columns).length !== 0 &&
      targetSelect.table !== ""
    ) {
      return false;
    }
  }

  return true;
}

function cycleExists(
  connection: Edge | Connection,
  nodes: Array<BuilderNode>,
  edges: Array<Edge>,
): boolean {
  const src = connection.source;
  const tgt = connection.target;

  if (!src || !tgt) return false;

  const sourceId = String(src);
  const targetId = String(tgt);

  if (sourceId === targetId) return true;

  const nodeIdSet = new Set<string>();
  for (let i = 0; i < nodes.length; ++i) nodeIdSet.add(nodes[i].id);
  if (!nodeIdSet.has(sourceId) || !nodeIdSet.has(targetId)) return false;

  const adj = new Map<string, string[]>();
  for (let i = 0; i < edges.length; ++i) {
    const e = edges[i];
    if (!e.source || !e.target) continue;
    const s = String(e.source);
    const t = String(e.target);
    const list = adj.get(s);
    if (list === undefined) adj.set(s, [t]);
    else list.push(t);
  }

  const visited = new Set<string>();
  const stack: string[] = [targetId];

  while (stack.length > 0) {
    const nodeId = stack.pop()!;
    if (nodeId === sourceId) return true;
    if (visited.has(nodeId)) continue;
    visited.add(nodeId);

    const neighbors = adj.get(nodeId);
    if (!neighbors) continue;
    for (let i = 0; i < neighbors.length; ++i) {
      const nb = neighbors[i];
      if (!visited.has(nb)) stack.push(nb);
    }
  }

  return false;
}

import type { BuilderNode } from "@type/node_properties";
import type { Connection, Edge } from "@xyflow/react";

export function isConnectionValid(
  connection: Edge | Connection,
  nodes: Array<BuilderNode>,
  edges: Array<Edge>,
): boolean {
  if (cycleExists(connection, nodes, edges)) {
    return false;
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

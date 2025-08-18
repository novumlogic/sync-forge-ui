type NodeProperties =  {
  id: string;
  type: "table" | "filter";
  data: Record<string, unknown>;
}

export type { NodeProperties };

import type TableColumn from "@/dto/table_column";

type GenericNodeProperties = {
  id: string;
  name: string;
  extras: Record<string, unknown>;
};

type TableNodeProperties = {
  type: "table";
  columns: Array<TableColumn>;
} & GenericNodeProperties;

type FilterNodeProperties = {
  type: "filter";
} & GenericNodeProperties;

type NodeProperties = TableNodeProperties | FilterNodeProperties;

export type { NodeProperties, TableNodeProperties, FilterNodeProperties };

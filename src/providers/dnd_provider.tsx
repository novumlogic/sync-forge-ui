import type { NodeProperties } from "@/type/node_properties";
import { createContext, useState, type ReactNode } from "react";

interface DnDContextValue {
  nodeProperties: NodeProperties | null;
  setNodeProperties: (nodeProperties: NodeProperties | null) => void;
}

export const DnDContext = createContext<
  [DnDContextValue["nodeProperties"], DnDContextValue["setNodeProperties"]]
>([null, () => {}]);

interface DnDProviderProps {
  children: ReactNode;
}
export function DnDProvider({ children }: Readonly<DnDProviderProps>) {
  const [type, setType] = useState<NodeProperties | null>(null);

  return (
    <DnDContext.Provider value={[type, setType]}>
      {children}
    </DnDContext.Provider>
  );
}

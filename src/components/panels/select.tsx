import useFocus from "@hooks/use_focus";
import type { SelectNodeProperties } from "@type/node_properties";
import { type JSX } from "react";

export default function SelectNodePropertiesPanel(): JSX.Element {
  const { focusedNodeProps } = useFocus();
  const { columns } = focusedNodeProps as SelectNodeProperties;
  
  return (
    <div>
      <section>
        <p>Columns</p>
        {Object.entries(columns).map(([colName]) => (
          <div key={colName}>
            <p>{colName}</p>
          </div>
        ))}
      </section>
    </div>
  );
}

import type { SelectNodeProperties } from "@type/node_properties";
import type { JSX } from "react";

export default function SelectNodePropertiesPanel({
  display_name,columns
}: SelectNodeProperties): JSX.Element {
  console.log(display_name, columns);
  
  return (
    <div>
      <section>
        <p>Columns</p>
        {
          Object.entries(columns).map(([colName]) => (
            <div key={colName}>
              <p>{colName}</p>
            </div>
          ))
        }
      </section>
    </div>
  );
}

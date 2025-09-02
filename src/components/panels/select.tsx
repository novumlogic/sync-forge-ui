import type { SelectNodeProperties } from "@type/node_properties";
import type { JSX } from "react";

export default function SelectNodePropertiesPanel({
  display_name,
}: SelectNodeProperties): JSX.Element {
  return (
    <div>
      <h3 className={"font-medium"}>Select Node Properties</h3>
      <pre>{display_name}</pre>
    </div>
  );
}

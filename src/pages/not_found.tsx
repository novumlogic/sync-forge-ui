import type { JSX } from "react";

export default function PageNotFound(): JSX.Element {
  return (
    <div className={"flex min-h-screen"}>
      <div className="m-auto">
        <h4 className={"text-2xl font-bold"}>Not Found</h4>
      </div>
    </div>
  );
}

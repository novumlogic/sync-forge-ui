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

import { Fragment, useEffect } from "react";
import Database from "@controllers/database";
import useDatabase from "@hooks/use_database";
import { Background, BackgroundVariant, ReactFlow } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { TableNode } from "@components/nodes";
import { KeyIcon } from "@heroicons/react/24/solid";
import { FingerPrintIcon } from "@heroicons/react/24/outline";

const database: Database = new Database();

export default function Home() {
  const {
    store: { schema },
    dispatch,
  } = useDatabase();

  useEffect(() => {
    if (schema !== null) {
      return;
    }
    database.getDatabaseSchema().then((result) => {
      if (result.ok) {
        dispatch({
          type: "SET_SCHEMA",
          payload: {
            schema: result.value.payload,
          },
        });
      } else {
        console.error(result.error);
      }
    });
  });

  if (schema === null) {
    return <Fragment />;
  }

  const { nodes, edges } = database.generateGraph(schema);

  return (
    <div>
      <div className={"h-[92.7dvh] w-dvw"}>
        <ReactFlow
          nodeTypes={{ table: TableNode }}
          defaultNodes={nodes}
          defaultEdges={edges}
          fitView
          proOptions={{
            hideAttribution: true,
          }}
          className={"h-full w-full"}
        >
          <Background variant={BackgroundVariant.Dots} bgColor="#171717" />
        </ReactFlow>
      </div>
      <div
        className={
          "bg-background text-foreground fixed bottom-0 flex h-[5dvh] w-full items-center justify-center space-x-10 border-t"
        }
      >
        <div className={"flex items-center gap-1 font-mono"}>
          <KeyIcon className={"size-4 fill-yellow-400"} />
          <span className={"text-xs"}>Primary Key</span>
        </div>
        <div className={"flex items-center gap-1 font-mono"}>
          <KeyIcon className={"size-4 fill-red-400"} />
          <span className={"text-xs"}>Foreign Key</span>
        </div>
        <div className={"flex items-center gap-1 font-mono"}>
          <FingerPrintIcon className={"size-4 text-purple-300"} />
          <span className={"text-xs"}>Unique</span>
        </div>
      </div>
    </div>
  );
}

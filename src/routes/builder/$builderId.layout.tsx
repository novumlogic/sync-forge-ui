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

import Database from "@controllers/database";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { DnDProvider } from "@providers/dnd_provider";
import FocusProvider from "@providers/focus_provider";
import type { JSX } from "react";

const database: Database = new Database();

export const Route = createFileRoute("/builder/$builderId")({
  loader: async ({ params }) => {
    const workflowResult = await database.getQuery(params.builderId);

    if (!workflowResult.ok) {
      throw Error(workflowResult.error.error);
    }

    return {
      workflow: workflowResult.value.payload,
    };
  },

  errorComponent: (p) => {
    return <div>{JSON.stringify(p.error.message)}</div>;
  },
  pendingComponent: () => {
    return <div>Loading..</div>;
  },
  component: BuilderLayout,
});

function BuilderLayout(): JSX.Element {
  return (
    <DnDProvider>
      <FocusProvider focusNodeProps={null}>
        <Outlet />
      </FocusProvider>
    </DnDProvider>
  );
}
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

import { useEffect, type JSX } from "react";
import { Button } from "@/components/ui/button.tsx";
import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import Database from "@/controllers/Database.ts";
import { toast } from "sonner";
import { useMatches } from "react-router";
import type RouteHandle from "@/type/route_handle";

export default function Navbar(): JSX.Element {
  const matches = useMatches();

  // find deepest (last) match that has a handle.title
  const matchWithTitle = [...matches]
    .reverse()
    .find((m) => (m.handle as RouteHandle | undefined)?.title);

  const title =
    (matchWithTitle?.handle as RouteHandle | undefined)?.title ?? "Syncforge";

  useEffect(() => {
    document.title = title;
  }, [title]);

  return (
    <header
      className={`fixed z-50 flex h-18 w-full items-center justify-between border-b bg-white/70 px-3 backdrop-blur-3xl md:px-16`}
    >
      <div className="flex items-center">
        <h1 className="text-xl font-bold">{title}</h1>
      </div>
      <div>
        <Button
          className={"cursor-pointer"}
          onClick={async () => {
            const run = async () => {
              const database = new Database();
              const res = await database.downloadDatabase();
              if (!res.ok)
                throw new Error(res.error?.error || "Download failed");

              const blob = new Blob([res.value.payload], {
                type: "application/octet-stream",
              });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "sqlite.db";
              document.body.appendChild(a);
              a.click();
              setTimeout(() => {
                URL.revokeObjectURL(url);
                a.remove();
              }, 1000);
            };

            toast.promise(run(), {
              loading: "Downloading your database…",
              success: "Database downloaded.",
              error: (err) => err?.message || "Could not download database.",
            });
          }}
        >
          <ArrowDownTrayIcon className={"size-4"} />
          <span>Download DB</span>
        </Button>
      </div>
    </header>
  );
}

import type { JSX } from "react";
import { Outlet } from "react-router";
import NavBar from "@/components/navbar.tsx";

export default function RootLayout(): JSX.Element {
  return (
    <div className={"flex min-h-dvh flex-col"}>
      <NavBar />
      <main>
        <Outlet />
      </main>
    </div>
  );
}

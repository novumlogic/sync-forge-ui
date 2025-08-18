import type { JSX } from "react";
import { Outlet } from "react-router";
import NavBar from "@/components/navbar.tsx";

export default function RootLayout(): JSX.Element {
  return (
    <div className={"flex min-h-dvh flex-col"}>
      <NavBar />
      <main className={"pt-18"}>
        <Outlet />
      </main>
    </div>
  );
}

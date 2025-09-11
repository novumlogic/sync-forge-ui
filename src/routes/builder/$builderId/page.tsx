import { FiltersPanel, TableDetailsPanel } from "@components/panels";
import { Button } from "@components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@components/ui/resizable";
import { ScrollArea } from "@components/ui/scroll_area";
import { FILTERS, SIDEPANEL_DEFAULT_WIDTH } from "@constants";
import { XMarkIcon } from "@heroicons/react/24/outline";
import useFocus from "@hooks/use_focus";
import { createFileRoute } from "@tanstack/react-router";
import { createElement, Fragment, useCallback, useRef, type JSX } from "react";
import type { ImperativePanelHandle } from "react-resizable-panels";
import BuilderProvider from "@providers/builder_provider";
import type { AnyNodeProps } from "@type/node_properties";
import Builder from "@components/builder";
import { Route as BuilderLayoutRoute } from "../$builderId.layout";
import type RouteMetadata from "@type/route_metadata";

export const Route = createFileRoute("/builder/$builderId/")({
  staticData: {
    title: "Query Builder",
  } satisfies RouteMetadata,
  component: BuilderPage,
});

function BuilderPage(): JSX.Element {
  const { focusedNodeProps, dispatch: focusDispatch } = useFocus();
  const { workflow } = BuilderLayoutRoute.useLoaderData();

  const filterPanelRef = useRef<ImperativePanelHandle>(null);

  const nodeClickHandler = useCallback(
    (node: AnyNodeProps) => {
      focusDispatch({ type: "FOCUS_NODE", payload: { properties: node } });

      if (!filterPanelRef.current?.isExpanded()) {
        filterPanelRef.current?.expand(SIDEPANEL_DEFAULT_WIDTH);
      }
    },
    [focusDispatch],
  );

  return (
    <ResizablePanelGroup
      direction={"horizontal"}
      className={"max-h-[92.7dvh] w-dvw"}
    >
      <ResizablePanel
        order={0}
        defaultSize={SIDEPANEL_DEFAULT_WIDTH}
        maxSize={SIDEPANEL_DEFAULT_WIDTH}
        collapsible={true}
      >
        <TableDetailsPanel />
      </ResizablePanel>
      <ResizableHandle className={"bg-border"} />
      <ResizablePanel
        order={1}
        defaultSize={Math.abs(100 - SIDEPANEL_DEFAULT_WIDTH)}
      >
        <BuilderProvider
          state={{
            nodes: workflow.nodes,
            edges: workflow.edges,
            instance: null,
          }}
        >
          <Builder onNodeClick={nodeClickHandler} />
        </BuilderProvider>
      </ResizablePanel>
      <ResizableHandle
        hidden={focusedNodeProps === null}
        className={"bg-border"}
      />
      <ResizablePanel
        order={2}
        defaultSize={0}
        maxSize={SIDEPANEL_DEFAULT_WIDTH}
        collapsible={true}
        ref={filterPanelRef}
      >
        <div className={"text-foreground h-full w-full bg-stone-900"}>
          <div className={"flex items-center justify-between px-3 py-4"}>
            <div className={"flex items-center space-x-2"}>
              <h5 className={"font-medium"}>
                {focusedNodeProps?.type === "table" ? "Filters" : "Properties"}
              </h5>
            </div>
            <Button
              size={"icon"}
              variant={"secondary"}
              className={"cursor-pointer bg-transparent"}
              onClick={() => {
                focusDispatch({ type: "CLEAR_FOCUS" });
                filterPanelRef.current?.collapse();
              }}
            >
              <XMarkIcon />
            </Button>
          </div>
          <div className={"flex h-full w-full flex-col items-start"}>
            <ScrollArea
              className={
                "bg-background text-foreground h-full w-full px-2 pt-3 pb-20"
              }
            >
              {focusedNodeProps !== null &&
              focusedNodeProps.type !== "table" ? (
                <Fragment>
                  {createElement(
                    FILTERS.find((f) => f.type === focusedNodeProps.type)!
                      .panelComponent,
                  )}
                </Fragment>
              ) : (
                <FiltersPanel filters={FILTERS} />
              )}
            </ScrollArea>
          </div>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

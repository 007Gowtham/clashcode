'use client';

import { cn } from "@/lib/utils";
import { Group, Panel, Separator } from "react-resizable-panels";

function ResizablePanelGroup({
  className,
  ...props
}) {
  return (
    <Group
      data-slot="resizable-panel-group"
      className={cn(
        "flex h-full w-full data-[panel-group-orientation=vertical]:flex-col",
        className
      )}
      {...props} />
  );
}

function ResizablePanel({
  ...props
}) {
  return <Panel data-slot="resizable-panel" {...props} />;
}

function ResizableHandle({
  withHandle,
  horizontal,
  className,
  ...props
}) {
  return (
    <Separator
      data-slot="resizable-handle"
      className={cn(
        "bg-border focus-visible:ring-ring relative flex items-center justify-center transition-all  focus-visible:ring-offset-1 focus-visible:outline-hidden z-20",
        // The divider line itself
        "data-[panel-group-orientation=vertical]:h-px data-[panel-group-orientation=vertical]:w-full bg-slate-200/40",
        "data-[panel-group-orientation=horizontal]:w-px data-[panel-group-orientation=horizontal]:h-full bg-slate-200/40",
        // Invisible hit area
        "data-[panel-group-orientation=vertical]:after:absolute data-[panel-group-orientation=vertical]:after:inset-x-0 data-[panel-group-orientation=vertical]:after:h-2 data-[panel-group-orientation=vertical]:after:-translate-y-1/2 data-[panel-group-orientation=vertical]:after:top-1/2",
        "data-[panel-group-orientation=horizontal]:after:absolute data-[panel-group-orientation=horizontal]:after:inset-y-0 data-[panel-group-orientation=horizontal]:after:w-2 data-[panel-group-orientation=horizontal]:after:-translate-x-1/2 data-[panel-group-orientation=horizontal]:after:left-1/2",
        className
      )}
      {...props}>

       {horizontal ? (
       <div className="bg-gray-400/40 h-[1.5px] w-5 rounded-xl"></div>
       ):(<div className="bg-gray-400/40 h-5 w-0.5 rounded-xl"></div>)}
     
      
    </Separator>
  );
}

export { ResizableHandle, ResizablePanel, ResizablePanelGroup };


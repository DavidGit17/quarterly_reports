"use client";

import * as ResizablePrimitive from "react-resizable-panels";

function ResizablePanel({
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.Panel>) {
  return <ResizablePrimitive.Panel data-slot="resizable-panel" {...props} />;
}

export { ResizablePanel };

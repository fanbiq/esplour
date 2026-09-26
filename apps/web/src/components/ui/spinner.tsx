import { Loader2Icon, LoaderIcon } from "lucide-react"

import { cn } from "@/lib/utils"

const Loader = LoaderIcon as unknown as React.ComponentType<React.ComponentProps<"svg">>

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <Loader
      role="status"
      aria-label="Loading"
      className={cn("size-4 animate-spin", className)}
      {...props}
    />
  )
}

export { Spinner }

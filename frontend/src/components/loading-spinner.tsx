import clsx from "clsx";
import { Loader2 } from "lucide-react";

export function LoadingSpinner({
  text,
  className,
}: {
  text?: string;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "flex items-center gap-2 rounded-md border border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground",
        className
      )}
    >
      <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden="true" />
      <span>{text ?? "Loading..."}</span>
    </div>
  );
}


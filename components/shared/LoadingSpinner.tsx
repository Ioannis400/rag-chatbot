"use client";

import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  className?: string;
}

export function LoadingSpinner({ className }: LoadingSpinnerProps) {
  return (
    <div
      className={cn(
        "h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin",
        className
      )}
    />
  );
}

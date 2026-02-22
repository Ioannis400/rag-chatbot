"use client";

import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import type { Document } from "@/types";

async function fetchDocumentBlob(id: number): Promise<Blob> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (!token) throw new Error("Not authenticated");
  const res = await fetch(`/api/documents/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to load document");
  return res.blob();
}

function isPdf(mimeType?: string): boolean {
  return mimeType === "application/pdf";
}

interface DocumentPreviewSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  doc: Document;
}

export function DocumentPreviewSheet({
  open,
  onOpenChange,
  doc,
}: DocumentPreviewSheetProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !doc.id) return;

    let url: string | null = null;
    let cancelled = false;

    void queueMicrotask(() => {
      setLoading(true);
      setError(null);
      setObjectUrl(null);
      setTextContent(null);
    });

    fetchDocumentBlob(doc.id)
      .then(async (b) => {
        if (cancelled) return;
        if (isPdf(doc.mimeType)) {
          url = URL.createObjectURL(b);
          setObjectUrl(url);
        } else {
          const text = await b.text();
          setTextContent(text);
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Fehler");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [open, doc.id, doc.mimeType]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="inset-0 h-dvh w-full max-h-none flex flex-col gap-0 rounded-none p-0 sm:max-w-none"
        showCloseButton={false}
      >
        <SheetHeader className="sticky top-0 z-10 shrink-0 border-b bg-background px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <SheetTitle className="truncate text-base font-medium">
              {doc.filename}
            </SheetTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              aria-label="Schließen"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-hidden">
          {loading && (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              Wird geladen…
            </div>
          )}
          {error && (
            <div className="flex h-full items-center justify-center text-destructive">
              {error}
            </div>
          )}
          {!loading && !error && isPdf(doc.mimeType) && objectUrl && (
            <iframe
              src={objectUrl}
              title={doc.filename}
              className="h-full w-full border-0"
            />
          )}
          {!loading && !error && !isPdf(doc.mimeType) && textContent !== null && (
            <pre className="h-full overflow-auto whitespace-pre-wrap break-words p-4 font-mono text-sm">
              {textContent}
            </pre>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

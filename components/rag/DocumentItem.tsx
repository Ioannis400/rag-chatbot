"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Trash2 } from "lucide-react";
import { DocumentPreviewSheet } from "./DocumentPreviewSheet";
import type { Document } from "@/types";

interface DocumentItemProps {
  doc: Document;
  onDelete: (id: number) => void;
}

function getFileIcon(filename: string) {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return "📄";
  if (ext === "txt" || ext === "md") return "📝";
  return "📁";
}

export function DocumentItem({ doc, onDelete }: DocumentItemProps) {
  const [previewOpen, setPreviewOpen] = useState(false);

  return (
    <motion.li
      layout
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="flex items-center justify-between gap-3 rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50"
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-2xl">
          {getFileIcon(doc.filename)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium" title={doc.filename}>
            {doc.filename}
          </p>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
            <Badge
              variant={doc.status === "INGESTED" ? "default" : "secondary"}
              className="shrink-0"
            >
              {doc.status}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {doc.chunkCount} Chunks
            </span>
            <span className="text-xs text-muted-foreground">
              {new Date(doc.createdAt).toLocaleDateString("de-DE")}
            </span>
          </div>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setPreviewOpen(true)}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Dokument ansehen"
        >
          <Eye className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(doc.id)}
          className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <DocumentPreviewSheet
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        doc={doc}
      />
    </motion.li>
  );
}

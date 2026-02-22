"use client";

import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadZoneProps {
  onUpload: (file: File) => Promise<void>;
  accept?: string;
  maxSize?: number;
}

export function UploadZone({
  onUpload,
  accept = ".pdf,.txt,.md",
  maxSize = 10 * 1024 * 1024,
}: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      if (file.size > maxSize) {
        setError("Datei zu groß (max 10MB)");
        return;
      }
      setIsUploading(true);
      try {
        await onUpload(file);
      } catch {
        setError("Upload fehlgeschlagen");
      } finally {
        setIsUploading(false);
      }
    },
    [onUpload, maxSize]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      e.target.value = "";
    },
    [handleFile]
  );

  return (
    <motion.div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      animate={{
        scale: isDragging ? 1.02 : 1,
        borderColor: isDragging ? "var(--primary)" : "var(--border)",
      }}
      className={cn(
        "relative rounded-xl border-2 border-dashed p-6 text-center transition-colors sm:p-8 md:p-12",
        "border-border bg-muted/30 hover:bg-muted/50"
      )}
    >
      <input
        type="file"
        accept={accept}
        onChange={handleChange}
        disabled={isUploading}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
      />
      {isUploading ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-2"
        >
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Wird verarbeitet...</p>
        </motion.div>
      ) : (
        <>
          <Upload className="mx-auto mb-2 h-10 w-10 text-muted-foreground" />
          <p className="text-muted-foreground mb-1">
            Datei hierher ziehen oder klicken
          </p>
          <p className="text-xs text-muted-foreground">PDF, TXT, MD (max 10MB)</p>
        </>
      )}
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 text-sm text-destructive"
        >
          {error}
        </motion.p>
      )}
    </motion.div>
  );
}

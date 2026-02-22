"use client";

import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UploadZone } from "@/components/shared/UploadZone";
import { useDocumentsStore } from "@/store/documents.store";

export function UploadSection() {
  const uploadDocument = useDocumentsStore((s) => s.uploadDocument);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card>
        <CardHeader>
          <CardTitle>Dokument hochladen</CardTitle>
          <CardDescription>
            PDF, TXT oder Markdown-Dateien werden automatisch verarbeitet und
            durchsuchbar gemacht.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UploadZone onUpload={uploadDocument} />
        </CardContent>
      </Card>
    </motion.div>
  );
}

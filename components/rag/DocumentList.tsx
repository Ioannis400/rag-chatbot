"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DocumentItem } from "./DocumentItem";
import { DeleteDialog } from "@/components/shared/DeleteDialog";
import { useDocumentsStore } from "@/store/documents.store";

export function DocumentList() {
  const { documents, loadDocuments, deleteDocument } = useDocumentsStore();
  const [deleteId, setDeleteId] = useState<number | null>(null);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleDelete = async (id: number) => {
    await deleteDocument(id);
    setDeleteId(null);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Meine Dokumente</CardTitle>
            <CardDescription>
              Alle hochgeladenen Dokumente und deren Verarbeitungsstatus.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {documents.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                Noch keine Dokumente. Lade PDF, TXT oder MD hoch.
              </div>
            ) : (
              <ul className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {documents.map((doc) => (
                    <DocumentItem
                      key={doc.id}
                      doc={doc}
                      onDelete={(id) => setDeleteId(id)}
                    />
                  ))}
                </AnimatePresence>
              </ul>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <DeleteDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={() => deleteId !== null && handleDelete(deleteId)}
        title="Dokument löschen"
        description="Das Dokument und alle zugehörigen Chunks werden unwiderruflich gelöscht."
      />
    </>
  );
}

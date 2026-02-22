"use client";

import { UploadSection } from "@/components/rag/UploadSection";
import { DocumentList } from "@/components/rag/DocumentList";

export default function RAGPage() {
  return (
    <div className="space-y-8">
      <UploadSection />
      <DocumentList />
    </div>
  );
}

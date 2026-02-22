"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface RenameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (newTitle: string) => void;
  currentTitle: string;
  label?: string;
}

function RenameDialogContent({
  currentTitle,
  onConfirm,
  onOpenChange,
  label,
}: {
  currentTitle: string;
  onConfirm: (newTitle: string) => void;
  onOpenChange: (open: boolean) => void;
  label: string;
}) {
  const [value, setValue] = useState(currentTitle || "");

  const handleConfirm = () => {
    const trimmed = value.trim();
    if (trimmed) {
      onConfirm(trimmed);
      onOpenChange(false);
    }
  };

  return (
    <>
      <DialogHeader>
          <DialogTitle>Chat umbenennen</DialogTitle>
          <DialogDescription>
            Gib einen neuen Namen für diesen Chat ein.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-4">
          <Label htmlFor="rename-input">{label}</Label>
          <Input
            id="rename-input"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="z.B. Projekt-Idee"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleConfirm();
            }}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button onClick={handleConfirm} disabled={!value.trim()}>
            Speichern
          </Button>
        </DialogFooter>
    </>
  );
}

export function RenameDialog({
  open,
  onOpenChange,
  onConfirm,
  currentTitle,
  label = "Neuer Name",
}: RenameDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {open && (
          <RenameDialogContent
            key={currentTitle}
            currentTitle={currentTitle}
            onConfirm={onConfirm}
            onOpenChange={onOpenChange}
            label={label}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

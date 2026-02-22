"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeleteDialog } from "@/components/shared/DeleteDialog";
import { RenameDialog } from "@/components/shared/RenameDialog";
import { useChatStore } from "@/store/chat.store";
import { Plus, MoreHorizontal, Pencil, Trash2, FileText, LogOut, BrainCircuit } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { Conversation } from "@/types";

interface ConversationSidebarProps {
  onSelect?: () => void;
  onLogout?: () => void;
  className?: string;
}

export function ConversationSidebar({
  onSelect,
  onLogout,
  className,
}: ConversationSidebarProps) {
  const {
    conversations,
    currentConvId,
    setCurrentConvId,
    loadConversations,
    createConversation,
    deleteConversation,
    renameConversation,
  } = useChatStore();

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [renameConv, setRenameConv] = useState<Conversation | null>(null);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const handleNewChat = async () => {
    await createConversation();
    onSelect?.();
  };

  const handleDelete = async (id: number) => {
    await deleteConversation(id);
    setDeleteId(null);
  };

  const handleRename = async (newTitle: string) => {
    if (!renameConv) return;
    await renameConversation(renameConv.id, newTitle);
    setRenameConv(null);
  };

  return (
    <aside className={cn("flex h-full w-full flex-col bg-[#f9f9f9]", className)}>
      {/* Logo + App Name */}
      <div className="flex h-12 shrink-0 items-center gap-2.5 px-4">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <BrainCircuit className="h-4 w-4" />
        </div>
        <span className="text-sm font-semibold leading-tight">
          AI Knowledge<br />
          <span className="text-xs font-normal text-muted-foreground">Chatbot</span>
        </span>
      </div>

      {/* New Chat */}
      <div className="px-2 pb-2 pt-1">
        <Button
          onClick={handleNewChat}
          variant="outline"
          className="w-full justify-start gap-2 bg-transparent text-sm"
          size="sm"
        >
          <Plus className="h-4 w-4" />
          Neuer Chat
        </Button>
      </div>

      {/* Chat list */}
      <ScrollArea className="flex-1 px-2">
        {conversations.length > 0 && (
          <p className="mb-1 px-2 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
            Chats
          </p>
        )}
        <div className="space-y-0.5 pb-4">
          {conversations.map((c) => (
            <div
              key={c.id}
              className={cn(
                "group flex items-center rounded-lg transition-colors",
                currentConvId === c.id
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
              )}
            >
              <button
                onClick={() => {
                  setCurrentConvId(c.id);
                  onSelect?.();
                }}
                className="min-w-0 flex-1 truncate px-3 py-2 text-left text-sm"
              >
                {c.title ?? `Chat ${c.id}`}
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="mr-1 h-7 w-7 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      setRenameConv(c);
                    }}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Umbenennen
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteId(c.id);
                    }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Löschen
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Bottom: Dokumente + Abmelden */}
      <div className="shrink-0 border-t px-2 py-2 space-y-0.5">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
          asChild
        >
          <Link href="/rag">
            <FileText className="h-4 w-4" />
            Dokumente
          </Link>
        </Button>
        {onLogout && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
            onClick={onLogout}
          >
            <LogOut className="h-4 w-4" />
            Abmelden
          </Button>
        )}
      </div>

      <DeleteDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={() => deleteId !== null && handleDelete(deleteId)}
        title="Chat löschen"
        description="Dieser Chat und alle Nachrichten werden unwiderruflich gelöscht."
      />
      <RenameDialog
        open={renameConv !== null}
        onOpenChange={(open) => !open && setRenameConv(null)}
        onConfirm={handleRename}
        currentTitle={renameConv?.title ?? `Chat ${renameConv?.id ?? ""}`}
      />
    </aside>
  );
}

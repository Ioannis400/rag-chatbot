"use client";

import { useEffect, useState } from "react";
import { ConversationSidebar } from "@/components/chat/ConversationSidebar";
import { MessageList } from "@/components/chat/MessageList";
import { ChatInput } from "@/components/chat/ChatInput";
import { useChatStore } from "@/store/chat.store";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { useRouter } from "next/navigation";

export default function ChatPage() {
  const { currentConvId, conversations, loadMessages, isStreaming } =
    useChatStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();

  useEffect(() => {
    if (currentConvId) {
      if (!isStreaming) {
        loadMessages(currentConvId);
      }
    } else {
      useChatStore.getState().setMessages([]);
    }
  }, [currentConvId, loadMessages, isStreaming]);

  const handleLogout = () => {
    logout();
    router.replace("/login");
    router.refresh();
  };

  const currentTitle =
    conversations.find((c) => c.id === currentConvId)?.title ??
    (currentConvId ? `Chat ${currentConvId}` : "Neuer Chat");

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      {/* ─── Desktop Sidebar (always visible lg+) ─── */}
      <aside className="hidden w-64 shrink-0 flex-col border-r bg-[#f9f9f9] lg:flex">
        <ConversationSidebar onLogout={handleLogout} />
      </aside>

      {/* ─── Main Area ─── */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Top bar – mobile: Burger + Title / Desktop: nur Title */}
        <header className="flex h-12 shrink-0 items-center gap-3 border-b bg-background px-4">
          {/* Burger nur auf Mobile */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Menü</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <ConversationSidebar
                onSelect={() => setMobileOpen(false)}
                onLogout={handleLogout}
                className="h-full w-full border-0 bg-[#f9f9f9]"
              />
            </SheetContent>
          </Sheet>
          {/* Aktueller Chat-Titel */}
          <span className="truncate text-sm font-medium text-muted-foreground">
            {currentTitle}
          </span>
        </header>

        <MessageList />
        <ChatInput />
      </div>
    </div>
  );
}

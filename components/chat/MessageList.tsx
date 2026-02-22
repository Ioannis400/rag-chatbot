"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChatMessage } from "./ChatMessage";
import { useChatStore } from "@/store/chat.store";
import { BrainCircuit, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

const SCROLL_THRESHOLD_LEAVE = 65; // when at bottom, scroll this far up to show "Nach unten"
const SCROLL_THRESHOLD_ENTER = 50;  // when not at bottom, get this close to hide button
const SCROLL_THROTTLE_MS = 80;

export function MessageList() {
  const messages = useChatStore((s) => s.messages);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);
  const lastScrollTimeRef = useRef(0);
  const [isUserAtBottom, setIsUserAtBottom] = useState(true);

  const checkAtBottom = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return true;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    const threshold = isAtBottomRef.current ? SCROLL_THRESHOLD_LEAVE : SCROLL_THRESHOLD_ENTER;
    return distanceFromBottom < threshold;
  }, []);

  const handleScroll = useCallback(() => {
    const now = Date.now();
    if (now - lastScrollTimeRef.current < SCROLL_THROTTLE_MS) return;
    lastScrollTimeRef.current = now;

    const atBottom = checkAtBottom();
    isAtBottomRef.current = atBottom;
    setIsUserAtBottom((prev) => (prev !== atBottom ? atBottom : prev));
  }, [checkAtBottom]);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    isAtBottomRef.current = true;
    setIsUserAtBottom(true);
  }, []);

  useEffect(() => {
    if (isAtBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "auto" });
    }
  }, [messages]);

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto"
        onScroll={handleScroll}
      >
      {messages.length === 0 ? (
        /* Welcome Screen */
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex h-full flex-col items-center justify-center gap-4 px-4"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border bg-background shadow-sm">
            <BrainCircuit className="h-7 w-7 text-primary" />
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-semibold tracking-tight">
              Wie kann ich dir helfen?
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Stelle eine Frage oder starte einen neuen Chat.
            </p>
          </div>
        </motion.div>
      ) : (
        /* Message Feed */
        <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
          <AnimatePresence mode="popLayout" initial={false}>
            {messages.map((m, i) => (
              <ChatMessage
                key={m.id != null ? `msg-id-${m.id}` : `msg-idx-${i}`}
                content={m.content}
                role={m.role}
                isStreaming={
                  isStreaming &&
                  i === messages.length - 1 &&
                  m.role === "assistant"
                }
                sources={m.sources}
              />
            ))}
          </AnimatePresence>
          <div ref={bottomRef} />
        </div>
      )}
      </div>
      {messages.length > 0 && !isUserAtBottom && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
          <Button
            size="sm"
            variant="secondary"
            className="shadow-md"
            onClick={scrollToBottom}
          >
            <ChevronDown className="mr-1 h-4 w-4" />
            Nach unten
          </Button>
        </div>
      )}
    </div>
  );
}

"use client";

import { useRef, useState } from "react";
import { useChatStore } from "@/store/chat.store";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function ChatInput() {
  const [input, setInput] = useState("");
  const sendMessage = useChatStore((s) => s.sendMessage);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const canSend = input.trim().length > 0 && !isStreaming;

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    await sendMessage(text);
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  };

  return (
    <div className="shrink-0 bg-background px-4 pb-5 pt-3">
      <div className="mx-auto max-w-3xl">
        {/* Input box */}
        <div
          className={cn(
            "relative flex items-end rounded-2xl border bg-background shadow-sm",
            "transition-shadow focus-within:shadow-md"
          )}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInput}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Stelle eine Frage..."
            rows={1}
            disabled={isStreaming}
            className={cn(
              "flex-1 resize-none bg-transparent px-4 py-3 text-sm outline-none",
              "placeholder:text-muted-foreground disabled:opacity-50",
              "max-h-[200px] min-h-[52px]"
            )}
          />
          {/* Send button inside */}
          <div className="flex shrink-0 items-end p-2">
            <button
              onClick={handleSend}
              disabled={!canSend}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full transition-colors",
                canSend
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
            >
              <ArrowUp className="h-4 w-4" />
              <span className="sr-only">Senden</span>
            </button>
          </div>
        </div>
        {/* Hint */}
        <p className="mt-2 text-center text-[11px] text-muted-foreground/70">
          KI kann Fehler machen – überprüfe wichtige Informationen.
        </p>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { motion } from "framer-motion";
import { BrainCircuit, FileText, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

import "highlight.js/styles/github-dark.css";

interface ChatMessageProps {
  content: string;
  role: "user" | "assistant";
  isStreaming?: boolean;
  sources?: string[];
}

export const ChatMessage = React.memo(function ChatMessage({
  content,
  role,
  isStreaming,
  sources,
}: ChatMessageProps) {
  const isUser = role === "user";
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [content]);

  if (isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="flex justify-end"
      >
        <div className="max-w-[75%] rounded-2xl bg-muted px-4 py-2.5 text-sm">
          <p className="whitespace-pre-wrap">{content}</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="group flex gap-3"
    >
      {/* AI Icon */}
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border bg-background">
        <BrainCircuit className="h-4 w-4 text-primary" />
      </div>
      {/* AI Content – no bubble, plain text */}
      <div className="min-w-0 flex-1 overflow-hidden pt-0.5">
        <div className={cn(
          "prose prose-sm max-w-none dark:prose-invert",
          // prevent any child from overflowing the column
          "overflow-hidden [&_*]:max-w-full",
          // long words / URLs break instead of overflowing
          "break-words [overflow-wrap:anywhere]",
          // Paragraphs
          "prose-p:leading-relaxed prose-p:my-3 prose-p:first:mt-0 prose-p:last:mb-0",
          // Headings
          "prose-headings:font-semibold prose-headings:tracking-tight",
          "prose-h1:text-xl prose-h2:text-lg prose-h3:text-base",
          // Lists
          "prose-ul:my-3 prose-ol:my-3 prose-li:my-0.5",
          "prose-ul:pl-5 prose-ol:pl-5",
          // Strong / em
          "prose-strong:font-semibold prose-em:italic",
          // Code inline
          "prose-code:rounded prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:text-[0.82em] prose-code:font-mono prose-code:before:content-none prose-code:after:content-none",
          // Code block – scrolls only within itself, never pushes the page
          "prose-pre:rounded-xl prose-pre:bg-zinc-900 prose-pre:text-zinc-100 prose-pre:p-4 prose-pre:my-4 prose-pre:overflow-x-auto prose-pre:max-w-full",
          // Blockquote
          "prose-blockquote:border-l-2 prose-blockquote:pl-4 prose-blockquote:text-muted-foreground",
          // HR
          "prose-hr:border-border",
        )}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
          >
            {content}
          </ReactMarkdown>
          {!isStreaming && sources && sources.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {sources.map((name) => (
                <span
                  key={name}
                  className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs text-muted-foreground"
                >
                  <FileText className="h-3 w-3 shrink-0" />
                  {name}
                </span>
              ))}
            </div>
          )}
          {isStreaming && (
            <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse rounded-full bg-foreground" />
          )}
        </div>
        {/* Copy button – appears on hover/touch like ChatGPT */}
        {!isStreaming && (
          <div className="mt-1 flex opacity-0 transition-opacity group-hover:opacity-100">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded-md px-1.5 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label="Nachricht kopieren"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              <span>{copied ? "Kopiert" : "Kopieren"}</span>
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
});

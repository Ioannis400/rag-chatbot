import { create } from "zustand";
import type { Conversation, ChatMessage } from "@/types";

interface ChatStore {
  conversations: Conversation[];
  currentConvId: number | null;
  messages: ChatMessage[];
  isStreaming: boolean;

  setCurrentConvId: (id: number | null) => void;
  loadConversations: () => Promise<void>;
  loadMessages: (convId: number) => Promise<void>;
  sendMessage: (text: string) => Promise<void>;
  createConversation: () => Promise<number | null>;
  deleteConversation: (id: number) => Promise<void>;
  renameConversation: (id: number, title: string) => Promise<void>;
  appendUserMessage: (content: string) => void;
  appendAssistantMessage: (content: string) => void;
  updateLastAssistantMessage: (content: string, sources?: string[]) => void;
  setMessages: (msgs: ChatMessage[]) => void;
  setStreaming: (v: boolean) => void;
}

async function fetchWithAuth(url: string, init?: RequestInit) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (!token) throw new Error("Not authenticated");
  const res = await fetch(url, {
    ...init,
    headers: {
      ...init?.headers,
      Authorization: `Bearer ${token}`,
    },
  });
  return res;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  conversations: [],
  currentConvId: null,
  messages: [],
  isStreaming: false,

  setCurrentConvId: (id) => set({ currentConvId: id }),
  setMessages: (msgs) => set({ messages: msgs }),
  setStreaming: (v) => set({ isStreaming: v }),

  loadConversations: async () => {
    const res = await fetchWithAuth("/api/conversations");
    if (res.ok) {
      const data = await res.json();
      set({ conversations: data });
    }
  },

  loadMessages: async (convId) => {
    const res = await fetchWithAuth(`/api/conversations/${convId}`);
    if (res.ok) {
      const data = await res.json();
      set({
        messages: data.messages.map(
          (m: { id: number; role: string; content: string }) => ({
            id: m.id,
            role: m.role as "user" | "assistant",
            content: m.content,
          })
        ),
      });
    }
  },

  createConversation: async () => {
    const res = await fetchWithAuth("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    if (!res.ok) return null;
    const data = await res.json();
    set({
      currentConvId: data.id,
      messages: [],
    });
    get().loadConversations();
    return data.id;
  },

  deleteConversation: async (id) => {
    const res = await fetchWithAuth(`/api/conversations/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) return;
    const { currentConvId } = get();
    if (currentConvId === id) {
      set({ currentConvId: null, messages: [] });
    }
    get().loadConversations();
  },

  renameConversation: async (id, title) => {
    const res = await fetchWithAuth(`/api/conversations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    if (!res.ok) return;
    get().loadConversations();
  },

  appendUserMessage: (content) =>
    set((s) => ({ messages: [...s.messages, { role: "user", content }] })),
  appendAssistantMessage: (content) =>
    set((s) => ({
      messages: [...s.messages, { role: "assistant", content }],
    })),
  updateLastAssistantMessage: (content, sources) =>
    set((s) => {
      const msgs = [...s.messages];
      const last = msgs.length - 1;
      if (last >= 0 && msgs[last]?.role === "assistant") {
        msgs[last] = { ...msgs[last]!, content, sources };
      }
      return { messages: msgs };
    }),

  sendMessage: async (text) => {
    const { currentConvId, createConversation } = get();
    let convId = currentConvId;

    set({ isStreaming: true });
    if (convId == null) {
      convId = await createConversation();
      if (convId == null) {
        set({ isStreaming: false });
        return;
      }
    }
    get().appendUserMessage(text);
    get().appendAssistantMessage("");

    try {
      const res = await fetchWithAuth("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, conversationId: convId }),
      });

      if (!res.ok || !res.body) {
        get().updateLastAssistantMessage("[Fehler bei der Anfrage]");
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        get().updateLastAssistantMessage(full);
      }
      const sourcesMatch = full.match(/\[\[SOURCES:(.*?)\]\]/);
      const sources = sourcesMatch
        ? sourcesMatch[1].split("|").filter(Boolean)
        : [];
      const cleanContent = full.replace(/\n\n\[\[SOURCES:.*?\]\]/, "").trimEnd();
      get().updateLastAssistantMessage(cleanContent, sources);
    } catch {
      get().updateLastAssistantMessage("[Verbindungsfehler]");
    } finally {
      set({ isStreaming: false });
    }
  },
}));

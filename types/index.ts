export interface Conversation {
  id: number;
  title: string | null;
  createdAt: string;
}

export interface ChatMessage {
  id?: number;
  role: "user" | "assistant";
  content: string;
  sources?: string[];
}

export interface Document {
  id: number;
  filename: string;
  status: string;
  chunkCount: number;
  createdAt: string;
  mimeType?: string;
}

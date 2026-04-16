export interface ApiKeyStatus {
  has_key: boolean;
  source: "user" | "server" | "none";
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  courseName?: string;
  subject?: string;
  dueDate?: string;
  status: "pending" | "in_progress" | "done";
  priority?: number;
}

export interface Document {
  id: string;
  filename: string;
  fileType: string;
  status: "pending" | "processing" | "ready" | "error";
  chunkCount?: number;
}

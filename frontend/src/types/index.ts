export type LLMProvider = "anthropic" | "gemini";

export interface ProviderKeyStatus {
  has_key: boolean;
}

export interface ApiKeyStatus {
  anthropic: ProviderKeyStatus;
  gemini: ProviderKeyStatus;
  active_provider: LLMProvider;
}

export interface ApiKeyVerifyResult {
  provider: LLMProvider;
  valid: boolean;
  error?: string | null;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
  intent?: string;
  sources?: string[];
}

export interface ChatSession {
  id: string;
  title: string;
  updatedAt: string;
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
  lmsUrl?: string;
}

export interface Document {
  id: string;
  filename: string;
  fileType: string;
  sizeBytes?: number;
  status: "pending" | "processing" | "ready" | "error";
  chunkCount?: number;
  subject?: string;
  courseName?: string;
  ingestedAt?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  age?: number;
  studentLevel?: "child" | "teen" | "adult";
  onboardingCompleted?: boolean;
}

export interface OnboardingData {
  age?: number;
  apiKey?: string;
  lmsProvider?: "moodle" | "google_classroom" | null;
}

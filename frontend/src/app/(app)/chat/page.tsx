"use client";
import ApiKeyBanner from "@/components/chat/ApiKeyBanner";
import ChatWindow from "@/components/chat/ChatWindow";
import { useApiKeyStatus } from "@/hooks/useApiKeyStatus";

export default function ChatPage() {
  const { loading, hasKey, refetch } = useApiKeyStatus();
  return (
    <main className="flex h-full flex-col">
      {!loading && hasKey === false && (
        <div className="px-4 pt-4">
          <ApiKeyBanner onKeyAdded={refetch} />
        </div>
      )}
      <ChatWindow />
    </main>
  );
}

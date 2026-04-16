"use client";

import ApiKeyBanner from "@/components/chat/ApiKeyBanner";
import { useApiKeyStatus } from "@/hooks/useApiKeyStatus";

export default function ChatPage() {
  const { loading, hasKey, refetch } = useApiKeyStatus();

  return (
    <main className="flex h-screen flex-col">
      {/* Banner — shown while loading (skeleton) and when key is missing */}
      {!loading && hasKey === false && (
        <div className="px-4 pt-4">
          <ApiKeyBanner onKeyAdded={refetch} />
        </div>
      )}

      {/* TODO: render ChatWindow here */}
      <div className="flex flex-1 items-center justify-center text-gray-400">
        Chat — coming soon
      </div>
    </main>
  );
}

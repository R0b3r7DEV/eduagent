"use client";
import { useUiStore } from "@/stores/uiStore";
import { useApiKeyStatus } from "@/hooks/useApiKeyStatus";
import ChatWindow from "@/components/chat/ChatWindow";
import ApiKeyBanner from "@/components/chat/ApiKeyBanner";
import RightPanel from "@/components/chat/RightPanel";

export default function ChatPage() {
  const { rightPanelOpen } = useUiStore();
  const { loading, hasKey } = useApiKeyStatus();

  return (
    <div className="flex h-full overflow-hidden">
      {/* Center column */}
      <main className="flex flex-1 flex-col overflow-hidden min-w-0">
        {!loading && hasKey === false && <ApiKeyBanner />}
        <ChatWindow />
      </main>

      {/* Right panel — collapsible */}
      {rightPanelOpen && <RightPanel />}
    </div>
  );
}

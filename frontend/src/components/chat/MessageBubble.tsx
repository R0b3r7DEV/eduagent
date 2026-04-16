import type { Message } from "@/stores/chatStore";

export default function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      {!isUser && (
        <div className="mr-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
          E
        </div>
      )}
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? "bg-blue-600 text-white rounded-br-sm"
            : "bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-sm"
        }`}
      >
        {msg.content}
        {msg.streaming && (
          <span className="ml-1 inline-block h-3 w-0.5 animate-pulse bg-current opacity-70" />
        )}
      </div>
    </div>
  );
}

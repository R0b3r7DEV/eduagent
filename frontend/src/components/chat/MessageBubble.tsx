import type { Message } from "@/stores/chatStore";

export default function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";

  return (
    <div className={`group flex gap-3 px-4 py-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {/* Avatar — assistant */}
      {!isUser && (
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-[11px] font-bold text-white shadow-sm">
          E
        </div>
      )}

      <div className={`flex max-w-[78%] flex-col gap-1 ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${
            isUser
              ? "bg-blue-600 text-white rounded-br-sm"
              : "bg-white text-gray-800 border border-gray-100 rounded-bl-sm"
          }`}
        >
          {msg.content || (msg.streaming && (
            <span className="flex gap-1 items-center py-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:0ms]" />
              <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:150ms]" />
              <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:300ms]" />
            </span>
          ))}
          {msg.streaming && msg.content && (
            <span className="ml-0.5 inline-block h-[14px] w-[2px] translate-y-[2px] animate-pulse rounded-full bg-current opacity-60" />
          )}
        </div>
      </div>

      {/* Avatar — user */}
      {isUser && (
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-200 text-[11px] font-bold text-gray-600">
          T
        </div>
      )}
    </div>
  );
}

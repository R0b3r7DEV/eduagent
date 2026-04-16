"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { MessageSquare, CheckSquare, FileText, Settings, LogOut, GraduationCap, Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useChatStore } from "@/stores/chatStore";
import { useState, useEffect } from "react";

const NAV = [
  { href: "/chat",      label: "Chat",        icon: MessageSquare },
  { href: "/tasks",     label: "Deberes",     icon: CheckSquare   },
  { href: "/documents", label: "Documentos",  icon: FileText      },
  { href: "/settings",  label: "Ajustes",     icon: Settings      },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const reset = useChatStore((s) => s.reset);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  function handleNewChat() {
    reset();
    router.push("/chat");
  }

  return (
    <aside className="flex h-screen w-60 flex-col bg-gray-900 text-white">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-gray-700/50">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500">
          <GraduationCap className="h-4.5 w-4.5 text-white" size={18} />
        </div>
        <span className="text-[15px] font-semibold tracking-tight">EduAgent AI</span>
      </div>

      {/* New chat */}
      <div className="px-3 pt-4 pb-2">
        <button
          onClick={handleNewChat}
          className="flex w-full items-center gap-2 rounded-lg border border-gray-600/60 px-3 py-2 text-sm text-gray-300 hover:border-gray-500 hover:bg-gray-800 transition-colors"
        >
          <Plus size={15} />
          Nuevo chat
        </button>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-0.5 px-3 flex-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-gray-700/80 text-white"
                  : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
              }`}
            >
              <Icon size={17} className={active ? "text-blue-400" : "text-gray-500"} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User + logout */}
      <div className="border-t border-gray-700/50 px-3 py-3">
        <div className="mb-1 px-3 py-1.5">
          <p className="text-xs text-gray-500 truncate">{email ?? "..."}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-400 hover:bg-gray-800 hover:text-gray-200 transition-colors"
        >
          <LogOut size={16} className="text-gray-500" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare, CheckSquare, FileText, Settings,
  LogOut, GraduationCap, Plus, PanelLeftClose, PanelLeftOpen, School,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useChatStore } from "@/stores/chatStore";
import { useUiStore } from "@/stores/uiStore";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

const NAV = [
  { href: "/chat",      label: "Chat",        icon: MessageSquare },
  { href: "/tasks",     label: "Deberes",     icon: CheckSquare   },
  { href: "/documents", label: "Documentos",  icon: FileText      },
  { href: "/lms",       label: "Aula Virtual", icon: School       },
  { href: "/settings",  label: "Ajustes",     icon: Settings      },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router   = useRouter();
  const reset    = useChatStore((s) => s.reset);
  const sessions = useChatStore((s) => s.sessions);
  const { sidebarCollapsed, toggleSidebar } = useUiStore();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  const initials = email ? email.slice(0, 2).toUpperCase() : "?";

  return (
    <TooltipProvider delayDuration={300}>
      <motion.aside
        animate={{ width: sidebarCollapsed ? 64 : 260 }}
        transition={{ duration: 0.22, ease: "easeInOut" }}
        className="relative flex h-screen flex-col border-r border-border bg-surface overflow-hidden"
      >
        {/* ── Header ───────────────────────────────────────── */}
        <div className="flex h-14 items-center justify-between px-3 border-b border-border shrink-0">
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex items-center gap-2.5"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-600">
                  <GraduationCap size={14} className="text-white" />
                </div>
                <span className="text-[15px] font-semibold text-text-primary">EduAgent AI</span>
              </motion.div>
            )}
          </AnimatePresence>
          {sidebarCollapsed && (
            <div className="mx-auto flex h-7 w-7 items-center justify-center rounded-lg bg-violet-600">
              <GraduationCap size={14} className="text-white" />
            </div>
          )}
          {!sidebarCollapsed && (
            <button onClick={toggleSidebar} className="text-text-muted hover:text-text-secondary transition-colors p-1 rounded-md hover:bg-surface-2">
              <PanelLeftClose size={16} />
            </button>
          )}
        </div>

        <div className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden no-scrollbar py-3">
          {/* ── New chat button ────────────────────────────── */}
          <div className="px-2 mb-3">
            {sidebarCollapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => { reset(); router.push("/chat"); }}
                    className="flex h-9 w-full items-center justify-center rounded-[--radius] border border-border text-text-muted hover:border-violet-600/50 hover:text-violet-400 transition-colors"
                  >
                    <Plus size={16} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">Nuevo chat</TooltipContent>
              </Tooltip>
            ) : (
              <button
                onClick={() => { reset(); router.push("/chat"); }}
                className="flex w-full items-center gap-2 rounded-[--radius] border border-border px-3 py-2 text-sm text-text-muted hover:border-violet-600/50 hover:bg-surface-2 hover:text-text-secondary transition-colors"
              >
                <Plus size={15} />
                Nuevo chat
              </button>
            )}
          </div>

          {/* ── Navigation ────────────────────────────────── */}
          <nav className="flex flex-col gap-0.5 px-2">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active = pathname.startsWith(href);
              const item = (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-3 rounded-[--radius] px-2.5 py-2 text-sm font-medium transition-colors",
                    sidebarCollapsed && "justify-center px-0",
                    active
                      ? "bg-violet-600/15 text-violet-400"
                      : "text-text-muted hover:bg-surface-2 hover:text-text-secondary"
                  )}
                >
                  <Icon size={16} className={active ? "text-violet-400" : "text-text-muted"} />
                  {!sidebarCollapsed && <span>{label}</span>}
                </Link>
              );
              return sidebarCollapsed ? (
                <Tooltip key={href}>
                  <TooltipTrigger asChild>{item}</TooltipTrigger>
                  <TooltipContent side="right">{label}</TooltipContent>
                </Tooltip>
              ) : item;
            })}
          </nav>

          {/* ── Recent conversations ──────────────────────── */}
          {!sidebarCollapsed && sessions.length > 0 && (
            <div className="mt-4 px-2">
              <p className="mb-1.5 px-2.5 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                Recientes
              </p>
              <div className="flex flex-col gap-0.5">
                {sessions.slice(0, 8).map((s) => (
                  <Link
                    key={s.id}
                    href={`/chat`}
                    onClick={() => useChatStore.setState({ sessionId: s.id, messages: [] })}
                    className="truncate rounded-[--radius] px-2.5 py-1.5 text-xs text-text-muted hover:bg-surface-2 hover:text-text-secondary transition-colors"
                  >
                    {s.title || "Conversación sin título"}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Footer: expand + user ─────────────────────── */}
        <div className="border-t border-border px-2 py-3 shrink-0">
          {sidebarCollapsed ? (
            <div className="flex flex-col items-center gap-2">
              <button onClick={toggleSidebar} className="text-text-muted hover:text-text-secondary transition-colors p-1">
                <PanelLeftOpen size={16} />
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="focus-visible:outline-none">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="right" align="end">
                  <DropdownMenuLabel>{email ?? "Usuario"}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut size={14} className="mr-2" />
                    Cerrar sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex w-full items-center gap-3 rounded-[--radius] px-2 py-1.5 hover:bg-surface-2 transition-colors focus-visible:outline-none">
                  <Avatar className="h-7 w-7 shrink-0">
                    <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="truncate text-xs font-medium text-text-secondary">{email ?? "Usuario"}</p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-52">
                <DropdownMenuLabel className="truncate">{email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings"><Settings size={14} className="mr-2" />Ajustes</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-error focus:text-error">
                  <LogOut size={14} className="mr-2" />Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </motion.aside>
    </TooltipProvider>
  );
}

"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/layout/Sidebar";
import { useUiStore } from "@/stores/uiStore";
import { MessageSquare, CheckSquare, FileText, School, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const MOBILE_NAV = [
  { href: "/chat",      label: "Chat",    icon: MessageSquare },
  { href: "/tasks",     label: "Deberes", icon: CheckSquare   },
  { href: "/documents", label: "Docs",    icon: FileText      },
  { href: "/lms",       label: "Aula",    icon: School        },
  { href: "/settings",  label: "Ajustes", icon: Settings      },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [ready, setReady]     = useState(false);
  const { mobileMenuOpen, setMobileMenu } = useUiStore();

  useEffect(() => {
    setMounted(true);
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.replace("/login");
      else setReady(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (!session) router.replace("/login");
    });
    return () => subscription.unsubscribe();
  }, [router]);

  // Close mobile menu on navigation
  useEffect(() => {
    setMobileMenu(false);
  }, [pathname, setMobileMenu]);

  if (!mounted || !ready) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-violet-500" />
          <p className="text-sm text-text-muted">Cargando…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-bg">

      {/* ── Desktop sidebar ──────────────────────────── */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* ── Mobile sidebar drawer ────────────────────── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileMenu(false)}
          />
          {/* Drawer panel */}
          <div className="absolute left-0 top-0 h-full w-[270px] shadow-2xl">
            <Sidebar onClose={() => setMobileMenu(false)} />
          </div>
        </div>
      )}

      {/* ── Main content + bottom nav ────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Page content */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {children}
        </div>

        {/* Mobile bottom navigation */}
        <nav
          className="md:hidden flex items-stretch border-t border-border bg-surface shrink-0"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          {MOBILE_NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex flex-1 flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium transition-colors",
                  active ? "text-violet-400" : "text-text-muted hover:text-text-secondary"
                )}
              >
                <Icon size={19} strokeWidth={active ? 2.5 : 1.8} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

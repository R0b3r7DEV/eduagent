"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/layout/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.replace("/login");
      else setReady(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (!session) router.replace("/login");
    });
    return () => subscription.unsubscribe();
  }, [router]);

  if (!ready) return <div className="flex h-screen items-center justify-center text-gray-400">Cargando…</div>;

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">{children}</div>
    </div>
  );
}

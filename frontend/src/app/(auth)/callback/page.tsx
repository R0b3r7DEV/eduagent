"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function CallbackPage() {
  const router = useRouter();
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      router.replace(session ? "/chat" : "/login");
    });
  }, [router]);
  return <p className="text-center text-gray-400">Autenticando…</p>;
}

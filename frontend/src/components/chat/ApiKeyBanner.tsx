"use client";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ApiKeyBanner() {
  return (
    <div className="mx-4 mt-3 flex items-center justify-between gap-4 rounded-[--radius-lg] border border-warning/30 bg-warning/8 px-4 py-3">
      <div className="flex items-center gap-2.5 text-sm text-warning">
        <AlertTriangle size={16} className="shrink-0" />
        <span>
          <strong>Sin API key</strong> — no puedo responderte.
        </span>
      </div>
      <Button asChild size="sm" variant="outline" className="shrink-0 border-warning/40 text-warning hover:bg-warning/10">
        <Link href="/settings">Configurar ahora</Link>
      </Button>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/chat", label: "Chat" },
  { href: "/tasks", label: "Deberes" },
  { href: "/documents", label: "Documentos" },
  { href: "/settings", label: "Ajustes" },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="flex h-screen w-56 flex-col border-r border-gray-200 bg-white px-3 py-6">
      <span className="mb-8 px-2 text-lg font-bold text-blue-600">EduAgent AI</span>
      <nav className="flex flex-col gap-1">
        {NAV.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              pathname.startsWith(href)
                ? "bg-blue-50 text-blue-700"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}

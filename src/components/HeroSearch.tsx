"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";

export default function HeroSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/ustadz?q=${encodeURIComponent(q)}`);
  };

  return (
    <form
      onSubmit={submit}
      className="flex w-full items-center gap-2 rounded-2xl bg-white p-2 shadow-xl shadow-emerald-950/20"
    >
      <Search className="ml-2 h-5 w-5 shrink-0 text-slate-500" />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Cari nama ustadz atau spesialisasi..."
        className="min-w-0 flex-1 bg-transparent text-sm text-slate-700 placeholder:text-slate-500 focus:outline-none sm:text-base"
      />
      <button
        type="submit"
        className="shrink-0 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700 sm:px-6"
      >
        Cari
      </button>
    </form>
  );
}

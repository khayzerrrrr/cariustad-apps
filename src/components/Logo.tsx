import Link from "next/link";
import { BookOpen } from "lucide-react";

export default function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2 group">
      <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-teal-700 text-white shadow-md shadow-primary-500/30 transition-transform group-hover:scale-105">
        <BookOpen className="h-5 w-5" strokeWidth={2.4} />
        <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-gold-400 ring-2 ring-white" />
      </span>
      <span
        className={`font-display text-xl font-bold tracking-tight ${
          light ? "text-white" : "text-slate-800"
        }`}
      >
        Cari<span className="text-primary-600">Ustadz</span>
      </span>
    </Link>
  );
}

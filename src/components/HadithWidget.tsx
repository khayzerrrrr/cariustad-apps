import { getDailyHadith } from "@/lib/data";
import { BookOpen, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function HadithWidget() {
  const hadith = getDailyHadith();
  return (
    <div className="rounded-2xl border border-sand-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 font-display text-lg font-bold text-slate-800">
          <BookOpen className="h-5 w-5 text-primary-500" />
          Hadith Hari Ini
        </h3>
        <Link
          href="/hadith"
          className="text-xs font-semibold text-primary-600 hover:underline"
        >
          Semua →
        </Link>
      </div>
      {hadith.arabic && (
        <p
          dir="rtl"
          className="mt-4 font-display text-lg leading-loose text-slate-700"
        >
          {hadith.arabic}
        </p>
      )}
      <p className="mt-3 text-sm leading-relaxed text-slate-600">
        &ldquo;{hadith.translation}&rdquo;
      </p>
      <div className="mt-3 flex items-center justify-between">
        <div className="text-xs text-slate-400">
          <span className="font-semibold text-slate-600">{hadith.source}</span>
          <br />
          {hadith.narrator}
        </div>
        <Link
          href="/hadith"
          className="inline-flex items-center gap-1 rounded-lg bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary-700 hover:bg-primary-100"
        >
          Baca selengkapnya <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}

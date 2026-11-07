import { hadithData, getDailyHadith } from "@/lib/data";
import { BookOpen, Quote } from "lucide-react";

export const metadata = {
  title: "Daily Hadith — CariUstadz",
  description: "Hadith harian pilihan untuk inspirasi dan renungan.",
};

export default function HadithPage() {
  const daily = getDailyHadith();

  return (
    <div className="bg-sand-50">
      {/* Hero with daily hadith */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-900 via-primary-850 to-teal-900">
        <div className="islamic-pattern absolute inset-0 opacity-[0.12]" />
        <div className="relative mx-auto max-w-3xl px-4 py-12 text-center sm:px-6 sm:py-16">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold text-white ring-1 ring-white/20">
            <BookOpen className="h-3.5 w-3.5" />
            Hadith Hari Ini
          </span>
          <Quote className="mx-auto mt-6 h-10 w-10 text-gold-400/80" />
          {daily.arabic && (
            <p
              dir="rtl"
              className="mt-4 font-display text-2xl leading-loose text-white sm:text-3xl"
            >
              {daily.arabic}
            </p>
          )}
          <p className="mt-5 text-lg leading-relaxed text-primary-50/95 sm:text-xl">
            &ldquo;{daily.translation}&rdquo;
          </p>
          <div className="mt-5 inline-flex flex-col items-center rounded-xl bg-white/10 px-5 py-3 text-white backdrop-blur-sm">
            <span className="text-sm font-semibold">{daily.source}</span>
            <span className="text-xs text-primary-50/80">
              {daily.narrator}
            </span>
            <span className="mt-1 rounded-full bg-gold-400/20 px-2 py-0.5 text-[10px] font-semibold text-gold-300">
              {daily.grade}
            </span>
          </div>
        </div>
      </div>

      {/* All hadith */}
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <h2 className="font-display text-xl font-bold text-slate-800 sm:text-2xl">
          Kumpulan Hadith Pilihan
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          {hadithData.length} hadith dari berbagai kitab hadith shahih.
        </p>

        <div className="mt-6 space-y-4">
          {hadithData.map((h) => (
            <div
              key={h.id}
              className={`rounded-2xl border p-5 ${
                h.id === daily.id
                  ? "border-primary-300 bg-primary-50/40"
                  : "border-sand-200 bg-white"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-primary-600">
                  {h.source}
                </span>
                {h.id === daily.id && (
                  <span className="rounded-full bg-primary-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                    Hari Ini
                  </span>
                )}
              </div>
              {h.arabic && (
                <p
                  dir="rtl"
                  className="mt-3 font-display text-xl leading-loose text-slate-700"
                >
                  {h.arabic}
                </p>
              )}
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                &ldquo;{h.translation}&rdquo;
              </p>
              <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                <span>{h.narrator}</span>
                <span>•</span>
                <span className="rounded-full bg-sand-100 px-2 py-0.5 font-medium text-slate-500">
                  {h.grade}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

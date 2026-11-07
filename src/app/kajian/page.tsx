"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  Clock,
  MapPin,
  User,
  Tag,
  ArrowRight,
} from "lucide-react";
import { kajianData, ustadzData } from "@/lib/data";
import { ALL_EVENT_TYPES, ALL_CITIES } from "@/lib/types";
import { formatRupiah } from "@/lib/storage";
import StaggerShaf from "@/components/motion/StaggerShaf";

const DAYS_ID = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const MONTHS_ID = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

function formatDate(iso: string) {
  const d = new Date(iso);
  return {
    day: DAYS_ID[d.getDay()],
    date: d.getDate(),
    month: MONTHS_ID[d.getMonth()],
    full: `${DAYS_ID[d.getDay()]}, ${d.getDate()} ${MONTHS_ID[d.getMonth()]} ${d.getFullYear()}`,
  };
}

export default function KajianPage() {
  const [city, setCity] = useState("");
  const [eventType, setEventType] = useState("");
  const [topic, setTopic] = useState("");

  const filtered = useMemo(() => {
    return kajianData.filter((k) => {
      const matchCity = !city || k.city === city;
      const matchEvent = !eventType || k.eventType === eventType;
      const matchTopic = !topic || k.topic === topic;
      return matchCity && matchEvent && matchTopic;
    });
  }, [city, eventType, topic]);

  const topics = Array.from(new Set(kajianData.map((k) => k.topic)));

  return (
    <div className="bg-sand-50">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-sand-200 bg-gradient-to-br from-primary-900 via-primary-850 to-teal-900">
        <div className="islamic-pattern absolute inset-0 opacity-[0.12]" />
        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white ring-1 ring-white/20">
            <CalendarDays className="h-3.5 w-3.5" />
            Info Kajian
          </span>
          <h1 className="mt-3 font-display text-2xl font-bold text-white sm:text-3xl">
            Kajian & Event yang Akan Datang
          </h1>
          <p className="mt-2 max-w-xl text-sm text-primary-50/90">
            Jelajahi kajian rutin, tabligh akbar, dan kelas Islami yang
            diadakan oleh ustadz di platform kami.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-2">
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="rounded-lg border border-sand-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:outline-none"
          >
            <option value="">Semua kota</option>
            {ALL_CITIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            className="rounded-lg border border-sand-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:outline-none"
          >
            <option value="">Semua jenis</option>
            {ALL_EVENT_TYPES.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
          <select
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="rounded-lg border border-sand-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:outline-none"
          >
            <option value="">Semua topik</option>
            {topics.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          {(city || eventType || topic) && (
            <button
              onClick={() => {
                setCity("");
                setEventType("");
                setTopic("");
              }}
              className="rounded-lg px-3 py-2 text-sm font-medium text-primary-600 hover:underline"
            >
              Reset
            </button>
          )}
        </div>

        <p className="mb-4 text-sm text-slate-500">
          <span className="font-semibold text-slate-700">{filtered.length}</span> kajian ditemukan
        </p>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-sand-300 bg-white py-16 text-center">
            <CalendarDays className="mx-auto h-10 w-10 text-sand-300" />
            <p className="mt-3 font-medium text-slate-600">
              Tidak ada kajian yang cocok
            </p>
          </div>
        ) : (
          <StaggerShaf className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {filtered.map((k) => {
              const ustadz = ustadzData.find((u) => u.id === k.ustadzId);
              const fd = formatDate(k.date);
              return (
                <div
                  key={k.id}
                  className="flex gap-4 rounded-2xl border border-sand-200 bg-white p-5 shadow-sm transition hover:border-primary-200 hover:shadow-lg hover:shadow-primary-500/10"
                >
                  {/* Date block */}
                  <div className="flex shrink-0 flex-col items-center justify-center rounded-xl bg-primary-50 px-3 py-2 text-primary-700">
                    <span className="text-xs font-medium">{fd.day}</span>
                    <span className="font-display text-2xl font-bold leading-none">
                      {fd.date}
                    </span>
                    <span className="text-xs font-medium">{fd.month}</span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap gap-1.5">
                      <span className="rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700">
                        {k.eventType}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          k.price === "Gratis"
                            ? "bg-green-50 text-green-600"
                            : "bg-amber-50 text-amber-600"
                        }`}
                      >
                        {k.price}
                        {k.fee ? ` • ${formatRupiah(k.fee)}` : ""}
                      </span>
                    </div>
                    <h3 className="mt-2 font-semibold text-slate-800">
                      {k.title}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                      {k.description}
                    </p>
                    <div className="mt-3 space-y-1 text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-primary-400" />
                        {ustadz ? `${ustadz.title} ${ustadz.name}` : "Ustadz"}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-primary-400" />
                        {fd.full} • {k.time}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-primary-400" />
                        {k.location}
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      {ustadz && (
                        <Link
                          href={`/ustadz/${ustadz.id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:underline"
                        >
                          Lihat ustadz <ArrowRight className="h-3 w-3" />
                        </Link>
                      )}
                      {ustadz && (
                        <Link
                          href={`/booking?ustadz=${ustadz.id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-primary-600"
                        >
                          <Tag className="h-3 w-3" /> Undang Ustadz Ini
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </StaggerShaf>
        )}
      </div>
    </div>
  );
}

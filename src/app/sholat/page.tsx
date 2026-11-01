"use client";

import { useEffect, useState } from "react";
import { Clock, Sunrise, Sunset, MapPin, Loader2, MoonStar } from "lucide-react";

// Mapping kota platform -> nama kota untuk API Aladhan
const API_CITIES: Record<string, string> = {
  "Jakarta Selatan": "Jakarta",
  "Jakarta Timur": "Jakarta",
  Bandung: "Bandung",
  Bogor: "Bogor",
  Depok: "Depok",
  Tangerang: "Tangerang",
  Bekasi: "Bekasi",
  Surabaya: "Surabaya",
  Yogyakarta: "Yogyakarta",
  Semarang: "Semarang",
  Makassar: "Makassar",
};

const PRAYER_META = [
  { key: "Imsak", label: "Imsak", icon: MoonStar, color: "text-indigo-500", bg: "bg-indigo-50" },
  { key: "Fajr", label: "Subuh", icon: Clock, color: "text-primary-600", bg: "bg-primary-50" },
  { key: "Sunrise", label: "Terbit", icon: Sunrise, color: "text-amber-500", bg: "bg-amber-50" },
  { key: "Dhuhr", label: "Dzuhur", icon: Clock, color: "text-yellow-500", bg: "bg-yellow-50" },
  { key: "Asr", label: "Ashar", icon: Clock, color: "text-orange-500", bg: "bg-orange-50" },
  { key: "Maghrib", label: "Maghrib", icon: Sunset, color: "text-rose-500", bg: "bg-rose-50" },
  { key: "Isha", label: "Isya", icon: MoonStar, color: "text-slate-600", bg: "bg-slate-100" },
];

interface ApiResponse {
  code: number;
  data: {
    timings: Record<string, string>;
    date: {
      readable: string;
      gregorian: { date: string; weekday: { en: string } };
      hijri: {
        date: string;
        day: string;
        month: { en: string; ar: string };
        year: string;
      };
    };
  };
}

export default function SholatPage() {
  const cities = Object.keys(API_CITIES);
  const [city, setCity] = useState("Jakarta Selatan");
  const [data, setData] = useState<ApiResponse["data"] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTimes = async () => {
      setLoading(true);
      setError("");
      try {
        const apiCity = API_CITIES[city];
        const res = await fetch(
          `https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(
            apiCity
          )}&country=Indonesia&method=20`
        );
        if (!res.ok) throw new Error("Gagal memuat jadwal");
        const json: ApiResponse = await res.json();
        if (json.code !== 200) throw new Error("Data tidak tersedia");
        setData(json.data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Terjadi kesalahan");
      } finally {
        setLoading(false);
      }
    };
    fetchTimes();
  }, [city]);

  // tentukan sholat berikutnya untuk highlight
  const nextKey = (() => {
    if (!data) return null;
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    for (const p of PRAYER_META) {
      const t = data.timings[p.key];
      if (!t) continue;
      const [h, m] = t.split(" ")[0].split(":").map(Number);
      if (h * 60 + m > nowMin) return p.key;
    }
    return PRAYER_META[0].key; // wrap ke besok
  })();

  return (
    <div className="bg-sand-50">
      {/* Header */}
      <div className="border-b border-sand-200 bg-gradient-to-br from-primary-900 via-primary-850 to-teal-900 islamic-pattern">
        <div className="mx-auto max-w-3xl px-4 py-10 text-center sm:px-6">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white ring-1 ring-white/20">
            <Clock className="h-3.5 w-3.5" />
            Jadwal Sholat
          </span>
          <h1 className="mt-3 font-display text-2xl font-bold text-white sm:text-3xl">
            Jadwal Sholat & Imsak
          </h1>
          <p className="mt-2 text-sm text-primary-50/90">
            Berdasarkan perhitungan Kemenag RI (metode 20).
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        {/* City selector */}
        <div className="flex items-center gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-sand-200 bg-white px-3">
            <MapPin className="h-5 w-5 text-primary-400" />
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full bg-transparent py-2.5 text-sm text-slate-700 focus:outline-none"
            >
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading && (
          <div className="mt-8 flex items-center justify-center py-12 text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
            <span className="ml-2 text-sm">Memuat jadwal...</span>
          </div>
        )}

        {error && !loading && (
          <div className="mt-8 rounded-xl border border-rose-200 bg-rose-50 p-4 text-center text-sm text-rose-600">
            {error}. Coba kota lain atau periksa koneksi internet.
          </div>
        )}

        {data && !loading && (
          <>
            {/* Date */}
            <div className="mt-6 flex items-center justify-between rounded-xl border border-sand-200 bg-white p-4">
              <div>
                <div className="text-xs text-slate-400">Tanggal Hijriah</div>
                <div className="font-semibold text-slate-700">
                  {data.date.hijri.day} {data.date.hijri.month.en} {data.date.hijri.year} H
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-400">Masehi</div>
                <div className="font-semibold text-slate-700">
                  {data.date.readable}
                </div>
              </div>
            </div>

            {/* Prayer grid */}
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {PRAYER_META.map((p) => {
                const time = data.timings[p.key] ?? "-";
                const clean = time.split(" ")[0];
                const isNext = p.key === nextKey;
                return (
                  <div
                    key={p.key}
                    className={`rounded-xl border p-4 text-center transition-all ${
                      isNext
                        ? "border-primary-400 bg-primary-50 shadow-md shadow-primary-500/10 ring-2 ring-primary-400"
                        : "border-sand-200 bg-white"
                    }`}
                  >
                    <p.icon
                      className={`mx-auto h-6 w-6 ${p.color}`}
                    />
                    <div className="mt-2 text-sm font-medium text-slate-600">
                      {p.label}
                    </div>
                    <div className="font-display text-xl font-bold text-slate-800">
                      {clean}
                    </div>
                    {isNext && (
                      <div className="mt-1 text-[10px] font-semibold text-primary-600">
                        Berikutnya ↓
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <p className="mt-4 text-center text-xs text-slate-400">
              Sumber: Aladhan API • Metode Kemenag RI (20) • Kota: {API_CITIES[city]}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

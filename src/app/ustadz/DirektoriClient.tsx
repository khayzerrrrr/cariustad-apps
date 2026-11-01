"use client";

import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, X, MapPin, Navigation, LocateFixed } from "lucide-react";
import { ustadzData } from "@/lib/data";
import { ALL_SPECIALIZATIONS, ALL_CITIES } from "@/lib/types";
import { haversine, formatDistance } from "@/lib/geo";
import UstadzCard from "@/components/UstadzCard";

type SortKey = "rating" | "experience" | "fee-low" | "fee-high" | "distance";

const RADIUS_OPTIONS = [
  { label: "Semua", value: 0 },
  { label: "5 km", value: 5 },
  { label: "10 km", value: 10 },
  { label: "25 km", value: 25 },
  { label: "50 km", value: 50 },
  { label: "100 km", value: 100 },
];

export default function DirektoriClient({
  initialQ,
  initialSpec,
}: {
  initialQ: string;
  initialSpec: string;
}) {
  const [q, setQ] = useState(initialQ);
  const [specs, setSpecs] = useState<Set<string>>(
    initialSpec ? new Set([initialSpec]) : new Set()
  );
  const [city, setCity] = useState<string>("");
  const [sort, setSort] = useState<SortKey>("rating");
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Location & radius
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [locLabel, setLocLabel] = useState<string>("");
  const [radius, setRadius] = useState<number>(0);
  const [locStatus, setLocStatus] = useState<"idle" | "loading" | "error">("idle");
  const [locError, setLocError] = useState<string>("");

  const applyMyLocation = () => {
    if (!navigator.geolocation) {
      setLocStatus("error");
      setLocError("Browser tidak mendukung geolokasi.");
      return;
    }
    setLocStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocLabel("Lokasi Anda (GPS)");
        setLocStatus("idle");
      },
      (err) => {
        setLocStatus("error");
        setLocError(
          err.code === err.PERMISSION_DENIED
            ? "Izin lokasi ditolak. Aktifkan izin lokasi di browser."
            : "Tidak dapat menentukan lokasi. Coba pilih kota manual."
        );
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // pilih kota manual sebagai "lokasi saya"
  const applyCityLocation = (cityName: string) => {
    if (!cityName) {
      setUserLoc(null);
      setLocLabel("");
      return;
    }
    // pakai koordinat kota dari ustadz pertama di kota itu
    const sample = ustadzData.find((u) => u.city === cityName);
    if (sample) {
      setUserLoc({ lat: sample.lat, lng: sample.lng });
      setLocLabel(`Sekitar ${cityName}`);
      setLocStatus("idle");
    }
  };

  // hitung jarak per ustadz
  const distanceMap = useMemo(() => {
    const map: Record<string, number> = {};
    if (userLoc) {
      for (const u of ustadzData) {
        map[u.id] = haversine(userLoc.lat, userLoc.lng, u.lat, u.lng);
      }
    }
    return map;
  }, [userLoc]);

  const toggleSpec = (s: string) => {
    setSpecs((prev) => {
      const next = new Set(prev);
      next.has(s) ? next.delete(s) : next.add(s);
      return next;
    });
  };

  const clearAll = () => {
    setQ("");
    setSpecs(new Set());
    setCity("");
    setOnlyAvailable(false);
    setRadius(0);
  };

  const clearLocation = () => {
    setUserLoc(null);
    setLocLabel("");
    setRadius(0);
    setLocStatus("idle");
    setLocError("");
  };

  const filtered = useMemo(() => {
    let list = ustadzData.filter((u) => {
      const matchQ =
        !q ||
        u.name.toLowerCase().includes(q.toLowerCase()) ||
        u.specializations.some((s) => s.toLowerCase().includes(q.toLowerCase()));
      const matchSpec =
        specs.size === 0 || u.specializations.some((s) => specs.has(s));
      const matchCity = !city || u.city === city;
      const matchAvail = !onlyAvailable || u.available;
      const matchRadius =
        !userLoc || radius === 0 || (distanceMap[u.id] ?? Infinity) <= radius;
      return matchQ && matchSpec && matchCity && matchAvail && matchRadius;
    });

    list = list.sort((a, b) => {
      switch (sort) {
        case "experience":
          return b.experience - a.experience;
        case "fee-low":
          return a.fee - b.fee;
        case "fee-high":
          return b.fee - a.fee;
        case "distance":
          return (distanceMap[a.id] ?? Infinity) - (distanceMap[b.id] ?? Infinity);
        default:
          return b.rating - a.rating;
      }
    });
    return list;
  }, [q, specs, city, sort, onlyAvailable, userLoc, radius, distanceMap]);

  const activeFilterCount =
    specs.size + (city ? 1 : 0) + (onlyAvailable ? 1 : 0) + (radius > 0 ? 1 : 0);

  const LocationSection = () => (
    <div className="mt-5">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        Lokasi & Jarak
      </h3>
      <button
        onClick={applyMyLocation}
        disabled={locStatus === "loading"}
        className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary-50 px-3 py-2 text-sm font-semibold text-primary-700 transition-colors hover:bg-primary-100 disabled:opacity-50"
      >
        <LocateFixed className="h-4 w-4" />
        {locStatus === "loading" ? "Mencari lokasi..." : "Gunakan Lokasi Saya"}
      </button>

      {locStatus === "error" && (
        <p className="mt-2 text-xs text-rose-500">{locError}</p>
      )}

      {/* pilih kota manual sebagai alternatif */}
      <div className="mt-2">
        <select
          value={userLoc && locLabel.startsWith("Sekitar") ? locLabel.replace("Sekitar ", "") : ""}
          onChange={(e) => applyCityLocation(e.target.value)}
          className="w-full rounded-lg border border-sand-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:outline-none"
        >
          <option value="">...atau pilih kota</option>
          {ALL_CITIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {userLoc && (
        <>
          <div className="mt-2 flex items-center justify-between rounded-lg bg-primary-50 px-3 py-1.5 text-xs text-primary-700">
            <span className="flex items-center gap-1">
              <Navigation className="h-3 w-3" /> {locLabel}
            </span>
            <button onClick={clearLocation} className="text-primary-500 hover:text-primary-700">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="mt-3">
            <label className="text-xs text-slate-400">Radius</label>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {RADIUS_OPTIONS.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setRadius(r.value)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                    radius === r.value
                      ? "bg-primary-600 text-white"
                      : "bg-sand-100 text-slate-600 hover:bg-sand-200"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="bg-sand-50">
      {/* Header */}
      <div className="border-b border-sand-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="font-display text-2xl font-bold text-slate-800 sm:text-3xl">
            Direktori Ustadz
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {ustadzData.length} ustadz terverifikasi siap membantu kebutuhan dakwah Anda.
          </p>

          {/* Search bar */}
          <div className="mt-4 flex gap-2">
            <div className="flex flex-1 items-center gap-2 rounded-xl border border-sand-200 bg-sand-50 px-3">
              <Search className="h-5 w-5 text-slate-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Cari nama atau bidang keahlian..."
                className="w-full bg-transparent py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
              />
              {q && (
                <button onClick={() => setQ("")} className="text-slate-400 hover:text-slate-600">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center gap-2 rounded-xl border border-sand-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-600 lg:hidden"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filter
              {activeFilterCount > 0 && (
                <span className="rounded-full bg-primary-600 px-1.5 text-xs text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
        {/* Sidebar Filters - desktop */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto rounded-2xl border border-sand-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-800">Filter</h2>
              {activeFilterCount > 0 && (
                <button
                  onClick={clearAll}
                  className="text-xs font-medium text-primary-600 hover:underline"
                >
                  Reset ({activeFilterCount})
                </button>
              )}
            </div>

            <LocationSection />

            {/* Spesialisasi */}
            <div className="mt-5">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Spesialisasi
              </h3>
              <div className="mt-3 space-y-2">
                {ALL_SPECIALIZATIONS.map((s) => (
                  <label
                    key={s}
                    className="flex cursor-pointer items-center gap-2 text-sm text-slate-600"
                  >
                    <input
                      type="checkbox"
                      checked={specs.has(s)}
                      onChange={() => toggleSpec(s)}
                      className="h-4 w-4 rounded border-sand-300 text-primary-600 focus:ring-primary-500"
                    />
                    {s}
                  </label>
                ))}
              </div>
            </div>

            {/* Kota */}
            <div className="mt-5">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Kota
              </h3>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="mt-3 w-full rounded-lg border border-sand-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value="">Semua kota</option>
                {ALL_CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Availability */}
            <div className="mt-5">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={onlyAvailable}
                  onChange={(e) => setOnlyAvailable(e.target.checked)}
                  className="h-4 w-4 rounded border-sand-300 text-primary-600 focus:ring-primary-500"
                />
                Hanya yang tersedia
              </label>
            </div>
          </div>
        </aside>

        {/* Mobile filter panel */}
        {showFilters && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-black/30"
              onClick={() => setShowFilters(false)}
            />
            <div className="absolute right-0 top-0 h-full w-80 max-w-[85%] overflow-y-auto bg-white p-5 shadow-xl">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-slate-800">Filter</h2>
                <button onClick={() => setShowFilters(false)}>
                  <X className="h-5 w-5 text-slate-400" />
                </button>
              </div>
              <LocationSection />
              <div className="mt-5">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Spesialisasi
                </h3>
                <div className="mt-3 space-y-2">
                  {ALL_SPECIALIZATIONS.map((s) => (
                    <label
                      key={s}
                      className="flex cursor-pointer items-center gap-2 text-sm text-slate-600"
                    >
                      <input
                        type="checkbox"
                        checked={specs.has(s)}
                        onChange={() => toggleSpec(s)}
                        className="h-4 w-4 rounded border-sand-300 text-primary-600 focus:ring-primary-500"
                      />
                      {s}
                    </label>
                  ))}
                </div>
              </div>
              <div className="mt-5">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Kota
                </h3>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="mt-3 w-full rounded-lg border border-sand-200 bg-white px-3 py-2 text-sm text-slate-700"
                >
                  <option value="">Semua kota</option>
                  {ALL_CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mt-5">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={onlyAvailable}
                    onChange={(e) => setOnlyAvailable(e.target.checked)}
                    className="h-4 w-4 rounded border-sand-300 text-primary-600 focus:ring-primary-500"
                  />
                  Hanya yang tersedia
                </label>
              </div>
              <div className="mt-6 flex gap-2">
                <button
                  onClick={clearAll}
                  className="flex-1 rounded-xl border border-sand-200 py-2.5 text-sm font-medium text-slate-600"
                >
                  Reset
                </button>
                <button
                  onClick={() => setShowFilters(false)}
                  className="flex-1 rounded-xl bg-primary-600 py-2.5 text-sm font-semibold text-white"
                >
                  Terapkan
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        <div className="min-w-0 flex-1">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              <span className="font-semibold text-slate-700">{filtered.length}</span> ustadz ditemukan
            </p>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="rounded-lg border border-sand-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:outline-none"
            >
              <option value="rating">Rating tertinggi</option>
              <option value="experience">Pengalaman terbanyak</option>
              <option value="fee-low">Biaya terendah</option>
              <option value="fee-high">Biaya tertinggi</option>
              {userLoc && <option value="distance">Terdekat dari saya</option>}
            </select>
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-sand-300 bg-white py-16 text-center">
              <MapPin className="mx-auto h-10 w-10 text-sand-300" />
              <p className="mt-3 font-medium text-slate-600">
                Tidak ada ustadz yang cocok
              </p>
              <p className="mt-1 text-sm text-slate-400">
                Coba ubah kata kunci, perbesar radius, atau reset filter.
              </p>
              <button
                onClick={clearAll}
                className="mt-4 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white"
              >
                Reset Filter
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((u) => (
                <UstadzCard
                  key={u.id}
                  ustadz={u}
                  distance={userLoc ? distanceMap[u.id] ?? null : null}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

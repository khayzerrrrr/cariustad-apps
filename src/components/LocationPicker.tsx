"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import {
  Search,
  MapPin,
  Crosshair,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  Navigation as NavIcon,
} from "lucide-react";
import { EventLocation } from "@/lib/types";
import { CITY_INFO } from "@/lib/regions";

const LocationPickerMap = dynamic(() => import("./LocationPickerMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center rounded-xl bg-sand-100">
      <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
    </div>
  ),
});

// Indonesia bounds
const ID_LAT_MIN = -11.0;
const ID_LAT_MAX = 6.0;
const ID_LNG_MIN = 94.0;
const ID_LNG_MAX = 141.0;

interface PhotonFeature {
  geometry: { coordinates: [number, number] }; // [lng, lat]
  properties: {
    name?: string;
    street?: string;
    housenumber?: string;
    city?: string;
    postcode?: string;
    state?: string;
    country?: string;
    osm_key?: string;
    osm_value?: string;
  };
}

interface SearchResultItem {
  lat: number;
  lng: number;
  name: string;
  detail: string;
}

interface LocationPickerProps {
  value: EventLocation | null;
  onChange: (loc: EventLocation) => void;
  initialPos?: { lat: number; lng: number };
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

function formatPhotonResult(props: PhotonFeature["properties"]): {
  name: string;
  detail: string;
} {
  const name = props.name || props.street || "Lokasi";
  const parts: string[] = [];
  if (props.housenumber) parts.push(props.housenumber);
  if (props.street && props.street !== name) parts.push(props.street);
  if (props.city) parts.push(props.city);
  if (props.state && props.state !== props.city) parts.push(props.state);
  if (props.country) parts.push(props.country);
  const detail = parts.join(", ");
  return { name, detail };
}

export default function LocationPicker({
  value,
  onChange,
  initialPos,
}: LocationPickerProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [geoLoading, setGeoLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPos, setSelectedPos] = useState<{ lat: number; lng: number } | null>(
    value ? { lat: value.lat, lng: value.lng } : null
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounce(query, 350);
  const searchAbort = useRef<AbortController | null>(null);

  // Simpan initialPos di ref agar identitas objek baru dari parent
  // (re-render setiap ketikan) tidak memicu ulang efek pencarian.
  const initialPosRef = useRef(initialPos);
  useEffect(() => {
    initialPosRef.current = initialPos;
  }, [initialPos]);

  // Click outside to close results
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const validateIndonesia = (lat: number, lng: number): boolean => {
    return (
      lat >= ID_LAT_MIN &&
      lat <= ID_LAT_MAX &&
      lng >= ID_LNG_MIN &&
      lng <= ID_LNG_MAX
    );
  };

  const reverseGeocode = useCallback(
    async (lat: number, lng: number): Promise<string> => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18`,
          { headers: {} }
        );
        if (!res.ok) return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        const data = await res.json();
        return data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      } catch {
        return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      }
    },
    []
  );

  const handlePick = useCallback(
    async (lat: number, lng: number, addressOverride?: string) => {
      setError(null);

      if (!validateIndonesia(lat, lng)) {
        setError("Lokasi di luar wilayah Indonesia. Pilih lokasi dalam negeri.");
        setSelectedPos({ lat, lng });
        return;
      }

      setSelectedPos({ lat, lng });
      const address =
        addressOverride ?? (await reverseGeocode(lat, lng));
      onChange({ lat, lng, address });
    },
    [onChange, reverseGeocode]
  );

  /** Fallback terakhir: pencarian offline dari 54 kota internal.
   *  Menjamin demo tetap jalan meski API pihak ketiga gagal/dibatasi. */
  const searchInternalCities = useCallback((q: string): SearchResultItem[] => {
    const needle = q.trim().toLowerCase();
    return CITY_INFO.filter(
      (c) =>
        c.city.toLowerCase().includes(needle) ||
        c.province.toLowerCase().includes(needle)
    )
      .slice(0, 6)
      .map((c) => ({
        lat: c.lat,
        lng: c.lng,
        name: c.city,
        detail: `${c.province} — pilih kota, lalu sesuaikan titik di peta`,
      }));
  }, []);

  // Autocomplete search: Photon → Nominatim → kota internal
  const runSearch = useCallback(
    async (q: string) => {
      const term = q.trim();
      if (term.length < 3) {
        setResults([]);
        setShowResults(false);
        return;
      }

      if (searchAbort.current) {
        searchAbort.current.abort();
      }
      const controller = new AbortController();
      searchAbort.current = controller;

      setSearching(true);
      setError(null);
      try {
        const lat = initialPosRef.current?.lat ?? -6.2;
        const lon = initialPosRef.current?.lng ?? 106.8;
        const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(
          term
        )}&lat=${lat}&lon=${lon}&limit=6`;

        let items: SearchResultItem[] = [];

        /* 1. Photon — bias lokasi, cocok untuk POI (masjid, gedung) */
        try {
          const res = await fetch(url, { signal: controller.signal });
          if (res.ok) {
            const data = await res.json();
            items = ((data.features as PhotonFeature[]) ?? [])
              .filter((f) => {
                const [fLng, fLat] = f.geometry.coordinates;
                return validateIndonesia(fLat, fLng);
              })
              .map((f) => {
                const [fLng, fLat] = f.geometry.coordinates;
                const { name, detail } = formatPhotonResult(f.properties);
                return { lat: fLat, lng: fLng, name, detail };
              });
          }
        } catch (err) {
          if (err instanceof DOMException && err.name === "AbortError") return;
        }

        /* 2. Nominatim — fallback bila Photon kosong/gagal */
        if (items.length === 0) {
          try {
            const res2 = await fetch(
              `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&accept-language=id&countrycodes=id&limit=6&q=${encodeURIComponent(
                term
              )}`,
              { signal: controller.signal }
            );
            if (res2.ok) {
              const data2 = await res2.json();
              items = (data2 as Array<{
                display_name: string;
                lat: string;
                lon: string;
              }>).map((r) => {
                const parts = r.display_name.split(",");
                return {
                  lat: parseFloat(r.lat),
                  lng: parseFloat(r.lon),
                  name: parts[0] || "Lokasi",
                  detail: parts.slice(1).join(",").trim(),
                };
              });
            }
          } catch (err) {
            if (err instanceof DOMException && err.name === "AbortError") return;
          }
        }

        /* 3. Kota internal — selalu ada hasil untuk nama kota/provinsi */
        if (items.length === 0) {
          items = searchInternalCities(term);
        }

        if (items.length === 0) {
          setResults([]);
          setShowResults(false);
          setError(
            `Tidak ditemukan hasil untuk "${term}". Coba nama kota (mis. "Bandung") atau klik langsung di peta.`
          );
        } else {
          setResults(items);
          setShowResults(true);
          setActiveIndex(-1);
        }
      } finally {
        setSearching(false);
      }
    },
    [searchInternalCities]
  );

  // Catat istilah yang sudah dicari: re-render parent TIDAK boleh
  // membuka ulang dropdown untuk istilah yang sama (bug popup muncul
  // terus saat mengetik di field lain).
  const lastSearchedRef = useRef<string>("");

  useEffect(() => {
    const q = debouncedQuery?.trim() ?? "";
    if (q.length < 3) {
      lastSearchedRef.current = "";
      setResults([]);
      setShowResults(false);
      return;
    }
    // Istilah sama + sudah pernah dicari → jangan picu ulang pencarian.
    if (q === lastSearchedRef.current && results.length > 0) return;
    lastSearchedRef.current = q;
    runSearch(q);
    return () => {
      if (searchAbort.current) {
        searchAbort.current.abort();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, runSearch]);

  const handleSelectResult = (r: SearchResultItem) => {
    setShowResults(false);
    setResults([]);
    setQuery(r.name);
    // Tandai istilah hasil terpilih agar efek debounce tidak mencari
    // ulang dan membuka kembali dropdown.
    lastSearchedRef.current = r.name.trim();
    handlePick(r.lat, r.lng, r.detail || r.name);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showResults || results.length === 0) {
      // Enter langsung mencari, tanpa menunggu debounce
      if (e.key === "Enter" && query.trim().length >= 3) {
        e.preventDefault();
        runSearch(query);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < results.length) {
        handleSelectResult(results[activeIndex]);
      } else if (results.length > 0) {
        handleSelectResult(results[0]);
      }
    } else if (e.key === "Escape") {
      setShowResults(false);
    }
  };

  const handleGeolocate = () => {
    setGeoLoading(true);
    setError(null);
    if (!navigator.geolocation) {
      setError("Browser tidak mendukung geolocation.");
      setGeoLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        await handlePick(pos.coords.latitude, pos.coords.longitude);
        setGeoLoading(false);
        setQuery("");
      },
      () => {
        setError("Tidak bisa mengakses lokasi. Izinkan akses lokasi di browser.");
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const clearSearch = () => {
    setQuery("");
    setResults([]);
    setShowResults(false);
    setError(null);
  };

  return (
    <div ref={containerRef} className="space-y-3">
      {/* Search bar — Google Maps style */}
      <div className="relative z-30">
        <div className="flex items-center gap-2 rounded-xl border border-sand-200 bg-white px-3 py-2 shadow-sm focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-500">
          <Search className="h-4 w-4 flex-shrink-0 text-slate-400" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (e.target.value.length === 0) {
                setResults([]);
                setShowResults(false);
                setError(null);
              }
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (results.length > 0) setShowResults(true);
            }}
            placeholder="Cari alamat, masjid, gedung, atau lokasi..."
            className="flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
            autoComplete="off"
          />
          {searching && (
            <Loader2 className="h-4 w-4 flex-shrink-0 animate-spin text-primary-500" />
          )}
          {!searching && query && (
            <button
              type="button"
              onClick={clearSearch}
              className="flex-shrink-0 rounded-full p-0.5 text-slate-400 hover:bg-sand-100 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <div className="h-5 w-px bg-sand-200" />
          <button
            type="button"
            onClick={handleGeolocate}
            disabled={geoLoading}
            title="Gunakan lokasi saya"
            className="flex-shrink-0 rounded-lg p-1 text-primary-600 hover:bg-primary-50 disabled:opacity-50"
          >
            {geoLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Crosshair className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Autocomplete dropdown */}
        {showResults && results.length > 0 && (
          <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-y-auto rounded-xl border border-sand-200 bg-white py-1 shadow-2xl ring-1 ring-black/5">
            {results.map((r, i) => (
              <button
                key={i}
                onClick={() => handleSelectResult(r)}
                onMouseEnter={() => setActiveIndex(i)}
                className={`flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors ${
                  activeIndex === i ? "bg-primary-50" : "hover:bg-sand-50"
                }`}
              >
                <MapPin
                  className={`mt-0.5 h-4 w-4 flex-shrink-0 ${
                    activeIndex === i ? "text-primary-600" : "text-slate-400"
                  }`}
                />
                <div className="min-w-0">
                  <div
                    className={`truncate text-sm font-medium ${
                      activeIndex === i ? "text-primary-700" : "text-slate-700"
                    }`}
                  >
                    {r.name}
                  </div>
                  {r.detail && (
                    <div className="truncate text-xs text-slate-400">
                      {r.detail}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map */}
      <div className="relative isolate z-0 h-[300px] overflow-hidden rounded-xl border border-sand-200">
        <LocationPickerMap
          initialPos={initialPos}
          selectedPos={selectedPos}
          onPick={(lat, lng) => {
            handlePick(lat, lng);
            setQuery("");
          }}
        />
      </div>

      {/* Validation status */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {value && !error && (
        <div className="flex items-start gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm">
          <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
          <div className="min-w-0">
            <span className="font-semibold text-green-700">Lokasi tervalidasi</span>
            <p className="mt-0.5 truncate text-green-600">{value.address}</p>
            <p className="mt-0.5 text-xs text-green-500">
              Koordinat: {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
            </p>
          </div>
        </div>
      )}

      {!value && !error && !searching && (
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <NavIcon className="h-3.5 w-3.5" />
          Ketik untuk mencari, klik peta, atau gunakan
          <button
            type="button"
            onClick={handleGeolocate}
            className="font-semibold text-primary-500 hover:underline"
          >
            lokasi saya
          </button>
        </div>
      )}
    </div>
  );
}

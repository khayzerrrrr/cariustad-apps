"use client";

import { useEffect, useState, useRef } from "react";
import {
  Compass,
  LocateFixed,
  Navigation,
  Loader2,
  MapPin,
  Info,
} from "lucide-react";
import { qiblaBearing, distanceToKaaba, formatDistance } from "@/lib/geo";

export default function KiblatPage() {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [bearing, setBearing] = useState<number | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const [locStatus, setLocStatus] = useState<"idle" | "loading" | "error">("idle");
  const [locError, setLocError] = useState("");
  const [compassStatus, setCompassStatus] = useState<"idle" | "active" | "unavailable">("idle");
  const compassRef = useRef<HTMLDivElement>(null);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocStatus("error");
      setLocError("Browser tidak mendukung geolokasi.");
      return;
    }
    setLocStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords({ lat: latitude, lng: longitude });
        setBearing(qiblaBearing(latitude, longitude));
        setDistance(distanceToKaaba(latitude, longitude));
        setLocStatus("idle");
      },
      (err) => {
        setLocStatus("error");
        setLocError(
          err.code === err.PERMISSION_DENIED
            ? "Izin lokasi ditolak. Aktifkan izin lokasi untuk menghitung arah kiblat."
            : "Tidak dapat menentukan lokasi."
        );
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Request device orientation for live compass
  const requestCompass = async () => {
    const handleOrientation = (event: DeviceOrientationEvent) => {
      // alpha = compass heading (0 = north), but on iOS it's relative without absolute
      let h: number | null = null;
      // @ts-expect-error webkit compass heading
      if (typeof event.webkitCompassHeading === "number") {
        // @ts-expect-error webkit compass heading
        h = event.webkitCompassHeading;
      } else if (event.alpha !== null) {
        h = 360 - event.alpha;
      }
      if (h !== null) {
        setHeading(h);
        setCompassStatus("active");
      }
    };

    try {
      // iOS 13+ requires explicit permission
      const DeviceOrientationAny = DeviceOrientationEvent as unknown as {
        requestPermission?: () => Promise<string>;
      };
      if (typeof DeviceOrientationAny.requestPermission === "function") {
        const result = await DeviceOrientationAny.requestPermission();
        if (result === "granted") {
          window.addEventListener("deviceorientation", handleOrientation, true);
        } else {
          setCompassStatus("unavailable");
        }
      } else if ("DeviceOrientationEvent" in window) {
        window.addEventListener("deviceorientationabsolute", handleOrientation as EventListener, true);
        window.addEventListener("deviceorientation", handleOrientation, true);
        // give it a moment to see if events fire
        setTimeout(() => {
          setHeading((prev) => {
            if (prev === null) setCompassStatus("unavailable");
            return prev;
          });
        }, 1500);
      } else {
        setCompassStatus("unavailable");
      }
    } catch {
      setCompassStatus("unavailable");
    }
  };

  useEffect(() => {
    requestLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Effective needle angle relative to screen-up:
  // if we have heading, the dial rotates by -heading so north aligns to real north.
  // the qibla needle sits at `bearing` on the dial.
  const dialRotation = heading != null ? -heading : 0;
  const needleAngle = bearing ?? 0;
  const aligned =
    heading != null && bearing != null
      ? Math.abs(((heading - bearing + 540) % 360) - 180) < 15
      : false;

  return (
    <div className="bg-sand-50">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-sand-200 bg-gradient-to-br from-primary-900 via-primary-850 to-teal-900">
        <div className="islamic-pattern absolute inset-0 opacity-[0.12]" />
        <div className="relative mx-auto max-w-3xl px-4 py-10 text-center sm:px-6">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white ring-1 ring-white/20">
            <Compass className="h-3.5 w-3.5" />
            Arah Kiblat
          </span>
          <h1 className="mt-3 font-display text-2xl font-bold text-white sm:text-3xl">
            Petunjuk Arah Kiblat
          </h1>
          <p className="mt-2 text-sm text-primary-50/90">
            Hadapkan diri ke arah Ka&apos;bah dengan bantuan kompas digital.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        {locStatus === "loading" && (
          <div className="flex items-center justify-center py-12 text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
            <span className="ml-2 text-sm">Mencari lokasi Anda...</span>
          </div>
        )}

        {locStatus === "error" && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-center text-sm text-rose-600">
            {locError}
            <button
              onClick={requestLocation}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white"
            >
              <LocateFixed className="h-4 w-4" /> Coba Lagi
            </button>
          </div>
        )}

        {coords && bearing != null && (
          <>
            {/* Compass */}
            <div className="flex flex-col items-center">
              <div
                ref={compassRef}
                className="relative"
                style={{
                  transform: `rotate(${dialRotation}deg)`,
                  transition: heading != null ? "transform 0.1s linear" : "none",
                }}
              >
                <svg viewBox="0 0 300 300" className="h-72 w-72 sm:h-80 sm:w-80">
                  {/* Outer ring */}
                  <circle
                    cx="150"
                    cy="150"
                    r="140"
                    fill="white"
                    stroke="#e7e5e4"
                    strokeWidth="2"
                  />
                  <circle
                    cx="150"
                    cy="150"
                    r="120"
                    fill="none"
                    stroke="#f5f5f4"
                    strokeWidth="1"
                  />

                  {/* Degree ticks */}
                  {Array.from({ length: 72 }).map((_, i) => {
                    const angle = i * 5;
                    const isMajor = i % 6 === 0;
                    const rad = (angle * Math.PI) / 180;
                    const r1 = 140;
                    const r2 = isMajor ? 125 : 132;
                    return (
                      <line
                        key={i}
                        x1={150 + r1 * Math.sin(rad)}
                        y1={150 - r1 * Math.cos(rad)}
                        x2={150 + r2 * Math.sin(rad)}
                        y2={150 - r2 * Math.cos(rad)}
                        stroke={isMajor ? "#94a3b8" : "#d6d3d1"}
                        strokeWidth={isMajor ? 2 : 1}
                      />
                    );
                  })}

                  {/* Cardinal directions */}
                  {[
                    { label: "N", angle: 0, color: "#ef4444" },
                    { label: "E", angle: 90, color: "#64748b" },
                    { label: "S", angle: 180, color: "#64748b" },
                    { label: "W", angle: 270, color: "#64748b" },
                  ].map((d) => {
                    const rad = (d.angle * Math.PI) / 180;
                    const r = 108;
                    return (
                      <text
                        key={d.label}
                        x={150 + r * Math.sin(rad)}
                        y={150 - r * Math.cos(rad) + 6}
                        textAnchor="middle"
                        fontSize="20"
                        fontWeight="bold"
                        fill={d.color}
                        fontFamily="var(--font-display), serif"
                      >
                        {d.label}
                      </text>
                    );
                  })}

                  {/* Qibla needle */}
                  <g
                    transform={`rotate(${needleAngle} 150 150)`}
                  >
                    {/* arrow body */}
                    <polygon
                      points="150,20 142,50 150,42 158,50"
                      fill="#059669"
                    />
                    <rect
                      x="147"
                      y="42"
                      width="6"
                      height="108"
                      fill="#10b981"
                      rx="3"
                    />
                    {/* Kaaba marker */}
                    <rect
                      x="143"
                      y="14"
                      width="14"
                      height="14"
                      fill="#1f2937"
                      rx="2"
                    />
                    <rect
                      x="143"
                      y="18"
                      width="14"
                      height="3"
                      fill="#fbbf24"
                    />
                  </g>

                  {/* Center dot */}
                  <circle cx="150" cy="150" r="6" fill="#059669" />
                  <circle cx="150" cy="150" r="3" fill="white" />
                </svg>
              </div>

              {/* Compass button */}
              {compassStatus !== "active" && compassStatus !== "unavailable" && (
                <button
                  onClick={requestCompass}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"
                >
                  <Compass className="h-4 w-4" />
                  Aktifkan Kompas Live
                </button>
              )}
              {compassStatus === "unavailable" && (
                <p className="mt-4 flex items-center gap-1.5 rounded-lg bg-sand-100 px-3 py-2 text-xs text-slate-500">
                  <Info className="h-4 w-4" />
                  Sensor kompas tidak tersedia. Putar perlahan mengikuti arah panah hijau ({bearing.toFixed(0)}° dari utara).
                </p>
              )}
              {aligned && compassStatus === "active" && (
                <div className="mt-4 animate-pulse rounded-lg bg-green-100 px-4 py-2 text-sm font-semibold text-green-700">
                  ✓ Anda menghadap kiblat!
                </div>
              )}
            </div>

            {/* Info cards */}
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-sand-200 bg-white p-4 text-center">
                <Navigation className="mx-auto h-6 w-6 text-primary-500" />
                <div className="mt-2 text-xs text-slate-400">Arah Kiblat</div>
                <div className="font-display text-2xl font-bold text-slate-800">
                  {bearing.toFixed(1)}°
                </div>
                <div className="text-xs text-slate-500">dari utara</div>
              </div>
              <div className="rounded-xl border border-sand-200 bg-white p-4 text-center">
                <MapPin className="mx-auto h-6 w-6 text-primary-500" />
                <div className="mt-2 text-xs text-slate-400">Jarak ke Ka&apos;bah</div>
                <div className="font-display text-2xl font-bold text-slate-800">
                  {distance != null ? formatDistance(distance) : "-"}
                </div>
                <div className="text-xs text-slate-500">
                  {distance != null ? `${Math.round(distance).toLocaleString("id-ID")} km` : ""}
                </div>
              </div>
              <div className="rounded-xl border border-sand-200 bg-white p-4 text-center">
                <Compass className="mx-auto h-6 w-6 text-primary-500" />
                <div className="mt-2 text-xs text-slate-400">Heading Anda</div>
                <div className="font-display text-2xl font-bold text-slate-800">
                  {heading != null ? `${heading.toFixed(0)}°` : "—"}
                </div>
                <div className="text-xs text-slate-500">
                  {compassStatus === "active" ? "kompas aktif" : "nonaktif"}
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="mt-6 rounded-xl border border-primary-100 bg-primary-50/40 p-4 text-sm text-slate-600">
              <p className="font-semibold text-slate-700">Cara menggunakan:</p>
              <ol className="mt-2 list-decimal space-y-1 pl-5">
                <li>
                  {compassStatus !== "active"
                    ? "Aktifkan kompas live (butuh sensor perangkat, paling akurat di HP)."
                    : "Putar tubuh perlahan hingga panah hijau menunjuk ke atas (arah depan Anda)."}
                </li>
                <li>
                  Jika sensor tidak tersedia, hadap ke utara lalu putar searah jarum jam{" "}
                  <strong>{bearing.toFixed(0)}°</strong>.
                </li>
                <li>
                  Arah panah hijau menunjuk ke Ka&apos;bah di Makkah. Saar sejajar, indikator &ldquo;menghadap kiblat&rdquo; akan muncul.
                </li>
              </ol>
            </div>

            <p className="mt-4 text-center text-xs text-slate-400">
              * Akurasi bergantung pada sensor perangkat. Untuk kepastian, gunakan kompas fisik atau aplikasi kiblat tersertifikasi.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

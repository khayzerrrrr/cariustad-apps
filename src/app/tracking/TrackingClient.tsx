"use client";

import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  Navigation,
  Clock,
  MapPin,
  Loader2,
  Car,
  CheckCircle2,
  RotateCcw,
  User,
  CalendarDays,
  ArrowLeft,
  Play,
  Radio,
  Zap,
  Timer,
} from "lucide-react";
import { ustadzData } from "@/lib/data";
import { getBookings } from "@/lib/storage";
import { haversine, formatDistance } from "@/lib/geo";
import { Booking, Ustadz } from "@/lib/types";

interface TrailPoint {
  lat: number;
  lng: number;
  time: string;
}

const TrackingMap = dynamic(() => import("./TrackingMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center rounded-2xl bg-sand-100">
      <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
    </div>
  ),
});

const REAL_INTERVAL = 300; // 5 menit dalam detik
const DEMO_INTERVAL = 20; // 20 detik untuk demo hackathon

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function formatTime(d: Date) {
  return d.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatCountdown(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function getStatus(progress: number): {
  label: string;
  color: string;
  bgColor: string;
  icon: typeof Car;
} {
  if (progress >= 1)
    return {
      label: "Tiba di lokasi",
      color: "text-green-600",
      bgColor: "bg-green-100",
      icon: CheckCircle2,
    };
  if (progress > 0.8)
    return {
      label: "Hampir tiba",
      color: "text-amber-600",
      bgColor: "bg-amber-100",
      icon: Navigation,
    };
  if (progress > 0.4)
    return {
      label: "Dalam perjalanan",
      color: "text-primary-600",
      bgColor: "bg-primary-100",
      icon: Car,
    };
  if (progress > 0)
    return {
      label: "Sudah berangkat",
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      icon: Car,
    };
  return {
    label: "Menunggu keberangkatan",
    color: "text-slate-500",
    bgColor: "bg-sand-100",
    icon: Clock,
  };
}

export default function TrackingClient({ bookingId }: { bookingId: string }) {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [ustadz, setUstadz] = useState<Ustadz | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [tracking, setTracking] = useState(false);
  const [progress, setProgress] = useState(0);
  const [trail, setTrail] = useState<TrailPoint[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [now, setNow] = useState(Date.now());
  const [demoMode, setDemoMode] = useState(true);
  const nextUpdateRef = useRef<number>(0);

  const updateInterval = demoMode ? DEMO_INTERVAL : REAL_INTERVAL;

  // Calculate route
  const route = useMemo(() => {
    if (!ustadz || !booking) return null;
    const origin = { lat: ustadz.lat, lng: ustadz.lng };
    // Use eventLocation from booking, or fallback to offset
    const dest = booking.eventLocation
      ? { lat: booking.eventLocation.lat, lng: booking.eventLocation.lng }
      : { lat: ustadz.lat + 0.06, lng: ustadz.lng + 0.045 };
    const total = haversine(origin.lat, origin.lng, dest.lat, dest.lng);
    const tripMinutes = Math.max(10, total * 2); // ~2 min/km (30 km/h), min 10 min
    const numUpdates = Math.max(3, Math.ceil(tripMinutes / 5));
    return { origin, dest, total, tripMinutes, numUpdates };
  }, [ustadz, booking]);

  const currentPos = useMemo(() => {
    if (!route) return { lat: 0, lng: 0 };
    return {
      lat: lerp(route.origin.lat, route.dest.lat, progress),
      lng: lerp(route.origin.lng, route.dest.lng, progress),
    };
  }, [route, progress]);

  // Load booking
  useEffect(() => {
    const all = getBookings();
    const b = all.find((x) => x.id === bookingId) ?? null;
    setBooking(b);
    if (b) {
      const u = ustadzData.find((x) => x.id === b.ustadzId) ?? null;
      setUstadz(u);
    }
    setLoaded(true);
  }, [bookingId]);

  // Tick every second when tracking
  useEffect(() => {
    if (!tracking || progress >= 1) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [tracking, progress]);

  // Check for position update
  useEffect(() => {
    if (!tracking || !route || progress >= 1) return;

    if (now >= nextUpdateRef.current) {
      const newProgress = Math.min(1, progress + 1 / route.numUpdates);
      const newPos = {
        lat: lerp(route.origin.lat, route.dest.lat, newProgress),
        lng: lerp(route.origin.lng, route.dest.lng, newProgress),
      };
      const updateTime = new Date();

      setProgress(newProgress);
      setLastUpdate(updateTime);
      setTrail((prev) => [
        ...prev,
        { lat: newPos.lat, lng: newPos.lng, time: formatTime(updateTime) },
      ]);

      if (newProgress >= 1) {
        setTracking(false);
      } else {
        nextUpdateRef.current = Date.now() + updateInterval * 1000;
      }
    }
  }, [now, tracking, route, progress, updateInterval]);

  const startTracking = useCallback(() => {
    if (!route) return;
    setProgress(0);
    const startTime = new Date();
    setTrail([
      { lat: route.origin.lat, lng: route.origin.lng, time: formatTime(startTime) },
    ]);
    setLastUpdate(startTime);
    nextUpdateRef.current = Date.now() + updateInterval * 1000;
    setTracking(true);
  }, [route, updateInterval]);

  const reset = useCallback(() => {
    setTracking(false);
    setProgress(0);
    setTrail([]);
    setLastUpdate(null);
  }, []);

  if (!loaded) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
      </div>
    );
  }

  if (!booking || !ustadz || !route) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <Navigation className="mx-auto h-12 w-12 text-sand-300" />
        <h1 className="mt-4 font-display text-xl font-bold text-slate-800">
          Undangan tidak ditemukan
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Lakukan undangan terlebih dahulu untuk melihat perjalanan ustadz/ustadzah
          menuju lokasi acara Anda.
        </p>
        <Link
          href="/booking"
          className="mt-6 inline-flex items-center gap-1.5 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"
        >
          <CalendarDays className="h-4 w-4" />
          Buat Undangan
        </Link>
      </div>
    );
  }

  const status = getStatus(progress);
  const distanceRemaining = route.total * (1 - progress);
  const etaMin = Math.max(1, Math.round((1 - progress) * route.tripMinutes));
  const StatusIcon = status.icon;
  const countdownSec =
    tracking && progress < 1 && progress > 0
      ? Math.max(0, Math.ceil((nextUpdateRef.current - now) / 1000))
      : 0;
  const countdownFmt = formatCountdown(countdownSec);
  const destLabel = booking.eventLocation?.address || booking.location || "Lokasi acara";

  return (
    <div className="bg-sand-50">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <Link
          href="/booking"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-primary-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke booking
        </Link>

        {/* Header */}
        <div className="mt-4 flex flex-col gap-4 rounded-2xl border border-sand-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
              <Navigation className="h-6 w-6" />
            </span>
            <div>
              <h1 className="font-display text-xl font-bold text-slate-800">
                Lihat Perjalanan Ustadz/Ustadzah
              </h1>
              <p className="text-sm text-slate-500">
                {ustadz.title} {ustadz.name} menuju {destLabel.split(",")[0]}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {tracking && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600">
                <Radio className="h-3.5 w-3.5 animate-pulse" />
                LIVE
              </span>
            )}
            <span
              className={`inline-flex items-center gap-1.5 rounded-full ${status.bgColor} px-3 py-1.5 text-sm font-semibold ${status.color}`}
            >
              <StatusIcon className="h-4 w-4" />
              {status.label}
            </span>
          </div>
        </div>

        {/* Mode toggle */}
        {!tracking && progress < 1 && (
          <div className="mt-4 flex items-center justify-between rounded-xl border border-sand-200 bg-white px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Timer className="h-4 w-4 text-primary-400" />
              Interval update:
              <span className="font-semibold text-slate-700">
                {demoMode ? "20 detik (Demo)" : "5 menit (Real)"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDemoMode(true)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                  demoMode
                    ? "bg-primary-600 text-white"
                    : "bg-sand-100 text-slate-500"
                }`}
              >
                <Zap className="mr-1 inline h-3 w-3" />
                Demo
              </button>
              <button
                onClick={() => setDemoMode(false)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                  !demoMode
                    ? "bg-primary-600 text-white"
                    : "bg-sand-100 text-slate-500"
                }`}
              >
                Real (5 menit)
              </button>
            </div>
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Map */}
          <div className="lg:col-span-2">
            <div className="h-[400px] overflow-hidden rounded-2xl border border-sand-200 shadow-sm sm:h-[480px]">
              <TrackingMap
                origin={route.origin}
                dest={route.dest}
                currentPos={currentPos}
                trail={trail}
                ustadzName={`${ustadz.title} ${ustadz.name}`}
                destLabel={destLabel}
                tracking={tracking}
              />
            </div>

            {/* Progress + countdown */}
            <div className="mt-4 rounded-2xl border border-sand-200 bg-white p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-700">
                  {booking.eventName}
                </span>
                <span className="font-semibold text-primary-600">
                  {Math.round(progress * 100)}%
                </span>
              </div>
              <div className="mt-2 h-3 overflow-hidden rounded-full bg-sand-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-500"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                <span>Lokasi asal ustadz</span>
                <span>{destLabel.split(",")[0]}</span>
              </div>

              {/* Countdown to next update */}
              {tracking && progress > 0 && progress < 1 && (
                <div className="mt-3 flex items-center justify-between rounded-lg bg-primary-50 px-3 py-2">
                  <div className="flex items-center gap-1.5 text-xs text-primary-600">
                    <Clock className="h-3.5 w-3.5" />
                    Update berikutnya dalam
                  </div>
                  <span className="font-display text-lg font-bold text-primary-700">
                    {countdownFmt}
                  </span>
                </div>
              )}

              {/* Last update time */}
              {lastUpdate && (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
                  <MapPin className="h-3 w-3" />
                  Lokasi terakhir diperbarui:{" "}
                  <span className="font-medium text-slate-500">
                    {formatTime(lastUpdate)}
                  </span>
                  <span className="text-slate-300">•</span>
                  {trail.length} titik dilacak
                </div>
              )}
            </div>
          </div>

          {/* Info panel */}
          <div className="space-y-4">
            {/* Booking detail */}
            <div className="rounded-2xl border border-sand-200 bg-white p-5">
              <h3 className="flex items-center gap-1.5 font-semibold text-slate-800">
                <CalendarDays className="h-4 w-4 text-primary-500" />
                Detail Undangan
              </h3>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-400">Ustadz</dt>
                  <dd className="font-medium text-slate-700">
                    {ustadz.title} {ustadz.name}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-400">Hari</dt>
                  <dd className="font-medium text-slate-700">{booking.day}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-400">Waktu</dt>
                  <dd className="font-medium text-slate-700">{booking.time}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-400">Acara</dt>
                  <dd className="font-medium text-slate-700">{booking.eventName}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="shrink-0 text-slate-400">Lokasi</dt>
                  <dd className="text-right font-medium text-slate-700">
                    {destLabel}
                  </dd>
                </div>
                {booking.eventLocation && (
                  <div className="flex justify-between gap-2">
                    <dt className="shrink-0 text-slate-400">Koordinat</dt>
                    <dd className="text-right text-xs font-medium text-slate-500">
                      {booking.eventLocation.lat.toFixed(4)},{" "}
                      {booking.eventLocation.lng.toFixed(4)}
                    </dd>
                  </div>
                )}
              </dl>
              <Link
                href={`/konsultasi?ustadz=${ustadz.id}`}
                className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-sand-200 py-2 text-sm font-semibold text-slate-700 hover:bg-sand-50"
              >
                <User className="h-4 w-4 text-primary-500" />
                Chat Ustadz
              </Link>
            </div>

            {/* Live stats */}
            <div className="rounded-2xl border border-sand-200 bg-white p-5">
              <h3 className="flex items-center gap-1.5 font-semibold text-slate-800">
                <Navigation className="h-4 w-4 text-primary-500" />
                Status Perjalanan
              </h3>
              <div className="mt-3 space-y-3">
                <div className="rounded-xl bg-sand-50 p-3">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <MapPin className="h-3.5 w-3.5" /> Jarak tersisa
                  </div>
                  <div className="font-display text-2xl font-bold text-slate-800">
                    {progress >= 1 ? "0 m" : formatDistance(distanceRemaining)}
                  </div>
                  <div className="text-xs text-slate-400">
                    dari total {formatDistance(route.total)}
                  </div>
                </div>
                <div className="rounded-xl bg-sand-50 p-3">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Clock className="h-3.5 w-3.5" /> Estimasi tiba
                  </div>
                  <div className="font-display text-2xl font-bold text-slate-800">
                    {progress >= 1 ? "Tiba" : `~${etaMin} menit`}
                  </div>
                  <div className="text-xs text-slate-400">
                    {progress >= 1
                      ? "Ustadz sudah di lokasi"
                      : `estimasi ${Math.round(route.tripMinutes)} menit total`}
                  </div>
                </div>
              </div>

              {/* Arrival notification */}
              {progress >= 1 && (
                <div className="mt-3 animate-fade-in rounded-xl bg-green-50 p-3 text-center text-sm font-semibold text-green-700">
                  <CheckCircle2 className="mx-auto h-6 w-6" />
                  Alhamdulillah, ustadz/ustadzah telah tiba di lokasi acara!
                </div>
              )}

              {/* Start / Reset buttons */}
              {!tracking && progress < 1 && (
                <button
                  onClick={startTracking}
                  className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary-600 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"
                >
                  <Play className="h-4 w-4" />
                  Mulai Pelacakan Live
                </button>
              )}

              {tracking && (
                <div className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-primary-50 py-2.5 text-sm font-semibold text-primary-700">
                  <Radio className="h-4 w-4 animate-pulse" />
                  Pelacakan aktif — lokasi update otomatis
                </div>
              )}

              {progress > 0 && (
                <button
                  onClick={reset}
                  className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-sand-200 py-2 text-sm font-semibold text-slate-600 hover:bg-sand-50"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset Pelacakan
                </button>
              )}
            </div>

            {/* Trail history */}
            {trail.length > 1 && (
              <div className="rounded-2xl border border-sand-200 bg-white p-5">
                <h3 className="flex items-center gap-1.5 font-semibold text-slate-800">
                  <MapPin className="h-4 w-4 text-primary-500" />
                  Riwayat Posisi ({trail.length})
                </h3>
                <div className="mt-3 max-h-40 space-y-1.5 overflow-auto">
                  {trail
                    .slice()
                    .reverse()
                    .map((p, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 rounded-lg bg-sand-50 px-2.5 py-1.5 text-xs"
                      >
                        <span
                          className={`inline-flex h-2 w-2 flex-shrink-0 rounded-full ${
                            i === 0
                              ? "bg-green-500"
                              : "bg-blue-500"
                          }`}
                        />
                        <span className="font-medium text-slate-600">
                          {p.time}
                        </span>
                        <span className="text-slate-400">
                          {p.lat.toFixed(4)}, {p.lng.toFixed(4)}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            <p className="text-center text-xs text-slate-400">
              {demoMode
                ? "* Mode demo: update setiap 20 detik untuk presentasi."
                : "* Mode real: update lokasi setiap 5 menit."}
              {" "}Posisi ustadz/ustadzah dapat dilihat oleh pengundang hingga tiba di lokasi.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

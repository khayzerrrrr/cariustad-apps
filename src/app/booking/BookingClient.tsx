"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarCheck,
  CheckCircle2,
  MapPin,
  Users,
  FileText,
  Clock,
  History,
  ArrowRight,
  Navigation,
  ShieldCheck,
  Smartphone,
  XCircle,
  AlertTriangle,
  BadgeCheck,
} from "lucide-react";
import { ustadzData } from "@/lib/data";
import { Booking, EventLocation } from "@/lib/types";
import {
  getBookings,
  addBooking,
  updateBookingStatus,
  getVerifiedPhone,
  setVerifiedPhone,
  formatRupiah,
} from "@/lib/storage";
import {
  checkBooking,
  generateOtp,
  isValidPhone,
  normalizePhone,
} from "@/lib/bookingGuard";
import Avatar from "@/components/Avatar";
import LocationPicker from "@/components/LocationPicker";

export default function BookingClient({
  initialUstadz,
  initialDay,
  initialTime,
}: {
  initialUstadz: string;
  initialDay: string;
  initialTime: string;
}) {
  const [ustadzId, setUstadzId] = useState(
    ustadzData.some((u) => u.id === initialUstadz)
      ? initialUstadz
      : ustadzData[0].id
  );
  const [day, setDay] = useState(initialDay || "");
  const [time, setTime] = useState(initialTime || "");
  const [form, setForm] = useState({
    eventName: "",
    location: "",
    audience: "",
    notes: "",
  });
  const [eventLocation, setEventLocation] = useState<EventLocation | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [success, setSuccess] = useState<Booking | null>(null);
  const [guardError, setGuardError] = useState<string | null>(null);

  // Verifikasi nomor HP (simulasi OTP)
  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpDemo, setOtpDemo] = useState<string | null>(null);
  const [otpInput, setOtpInput] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    setBookings(getBookings());
    if (getVerifiedPhone()) setVerified(true);
  }, []);

  const handleSendOtp = () => {
    setOtpError(null);
    if (!isValidPhone(phone)) {
      setOtpError("Nomor HP tidak valid. Gunakan format 08xx atau +628xx.");
      return;
    }
    // Demo: kode ditampilkan di layar. Produksi: dikirim via WhatsApp/SMS.
    setOtpDemo(generateOtp());
    setOtpSent(true);
  };

  const handleVerifyOtp = () => {
    if (otpInput.trim() === otpDemo) {
      setVerifiedPhone(normalizePhone(phone));
      setVerified(true);
      setOtpError(null);
    } else {
      setOtpError("Kode verifikasi salah. Periksa kembali.");
    }
  };

  const selectedUstadz = useMemo(
    () => ustadzData.find((u) => u.id === ustadzId)!,
    [ustadzId]
  );

  const availableDays = selectedUstadz.schedule.map((d) => d.day);
  const selectedDaySchedule = selectedUstadz.schedule.find(
    (d) => d.day === day
  );
  const availableSlots =
    selectedDaySchedule?.slots.filter((s) => !s.booked) ?? [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!day || !time || !form.eventName.trim() || !form.location.trim()) return;
    if (!eventLocation) return;
    if (!verified) {
      setGuardError(
        "Verifikasi nomor WhatsApp Anda terlebih dahulu sebelum booking."
      );
      return;
    }

    const booking: Booking = {
      id: `b_${Date.now()}`,
      ustadzId: selectedUstadz.id,
      ustadzName: `${selectedUstadz.title} ${selectedUstadz.name}`,
      day,
      time,
      eventName: form.eventName.trim(),
      location: form.location.trim(),
      eventLocation,
      audience: form.audience.trim() || "-",
      notes: form.notes.trim(),
      status: "pending",
      contactPhone: normalizePhone(phone),
      createdAt: new Date().toISOString(),
    };

    // ── Anti-abuse guard: tolak booking iseng sebelum tercatat ──
    const guard = checkBooking(getBookings(), booking);
    if (!guard.allowed) {
      setGuardError(guard.reason ?? "Booking tidak dapat diproses.");
      return;
    }

    addBooking(booking);
    setBookings((prev) => [booking, ...prev]);
    setSuccess(booking);
    setGuardError(null);
    setForm({ eventName: "", location: "", audience: "", notes: "" });
    setEventLocation(null);
    setDay("");
    setTime("");
  };

  const handleCancel = (id: string) => {
    const updated = updateBookingStatus(id, "cancelled");
    setBookings(updated);
  };

  return (
    <div className="bg-sand-50">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
            <CalendarCheck className="h-3.5 w-3.5" />
            Booking Jadwal Kajian
          </span>
          <h1 className="mt-3 font-display text-2xl font-bold text-slate-800 sm:text-3xl">
            Ajak Ustadz ke Acara Anda
          </h1>
          <p className="mx-auto mt-2 max-w-lg text-sm text-slate-500">
            Verifikasi nomor WhatsApp, pilih ustadz dan slot waktu, lalu kirim
            detail undangan. Setiap booking melewati pemeriksaan anti-spam
            untuk melindungi jadwal ustadz.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="space-y-5 rounded-2xl border border-sand-200 bg-white p-6 lg:col-span-2"
          >
            {/* Verifikasi nomor WhatsApp (anti booking iseng) */}
            <div className="rounded-xl border border-primary-100 bg-primary-50/50 p-4">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                  <ShieldCheck className="h-4 w-4 text-primary-500" />
                  Verifikasi Nomor WhatsApp
                </label>
                {verified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">
                    <BadgeCheck className="h-3 w-3" />
                    Terverifikasi
                  </span>
                )}
              </div>

              {!verified ? (
                <>
                  <p className="mt-1.5 text-xs text-slate-500">
                    Nomor terverifikasi dipakai ustadz menghubungi Anda dan
                    mencegah booking palsu. Satu nomor = satu pemesan.
                  </p>
                  <div className="mt-3 flex gap-2">
                    <div className="relative flex-1">
                      <Smartphone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="08xxxxxxxxxx"
                        disabled={otpSent}
                        inputMode="tel"
                        className="w-full rounded-lg border border-sand-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:bg-sand-100"
                      />
                    </div>
                    {!otpSent ? (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        className="shrink-0 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
                      >
                        Kirim Kode
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setOtpSent(false);
                          setOtpDemo(null);
                          setOtpInput("");
                        }}
                        className="shrink-0 rounded-lg border border-sand-200 px-3 py-2 text-xs font-medium text-slate-500 hover:bg-sand-50"
                      >
                        Ubah
                      </button>
                    )}
                  </div>

                  {otpError && (
                    <p className="mt-2 flex items-center gap-1 text-xs text-red-600">
                      <AlertTriangle className="h-3 w-3" /> {otpError}
                    </p>
                  )}

                  {otpSent && otpDemo && (
                    <div className="mt-3 space-y-2">
                      <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                        <strong>Mode demo:</strong> kode verifikasi Anda{" "}
                        <span className="font-mono font-bold">{otpDemo}</span>
                        {" "}— di produksi dikirim via WhatsApp.
                      </div>
                      <div className="flex gap-2">
                        <input
                          value={otpInput}
                          onChange={(e) => setOtpInput(e.target.value)}
                          placeholder="Masukkan 6 digit kode"
                          inputMode="numeric"
                          maxLength={6}
                          className="flex-1 rounded-lg border border-sand-200 bg-white px-3 py-2 font-mono text-sm tracking-widest text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                        />
                        <button
                          type="button"
                          onClick={handleVerifyOtp}
                          className="shrink-0 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                        >
                          Verifikasi
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="mt-1.5 flex items-center gap-1.5 text-xs text-green-700">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {getVerifiedPhone()} siap digunakan untuk booking.
                </p>
              )}
            </div>

            {/* Pilih ustadz */}
            <div>
              <label className="text-sm font-semibold text-slate-700">
                Pilih Ustadz
              </label>
              <select
                value={ustadzId}
                onChange={(e) => {
                  setUstadzId(e.target.value);
                  setDay("");
                  setTime("");
                }}
                className="mt-2 w-full rounded-xl border border-sand-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                {ustadzData.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.title} {u.name} — {u.city}
                  </option>
                ))}
              </select>

              {/* Ustadz preview */}
              <div className="mt-3 flex items-center gap-3 rounded-xl bg-sand-50 p-3">
                <Avatar
                  name={selectedUstadz.name}
                  gradient={selectedUstadz.avatarGradient}
                  size="md"
                />
                <div className="min-w-0">
                  <div className="truncate font-semibold text-slate-800">
                    {selectedUstadz.title} {selectedUstadz.name}
                  </div>
                  <div className="text-xs text-slate-400">
                    {selectedUstadz.specializations.join(", ")} •{" "}
                    {formatRupiah(selectedUstadz.fee)}/acara
                  </div>
                </div>
                <Link
                  href={`/ustadz/${selectedUstadz.id}`}
                  className="ml-auto shrink-0 text-xs font-semibold text-primary-600 hover:underline"
                >
                  Lihat profil
                </Link>
              </div>
            </div>

            {/* Pilih hari */}
            <div>
              <label className="text-sm font-semibold text-slate-700">Hari</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {availableDays.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => {
                      setDay(d);
                      setTime("");
                    }}
                    className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      day === d
                        ? "bg-primary-600 text-white"
                        : "bg-sand-100 text-slate-600 hover:bg-sand-200"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Pilih slot */}
            {day && (
              <div className="animate-fade-in">
                <label className="text-sm font-semibold text-slate-700">
                  Slot Waktu Tersedia
                </label>
                {availableSlots.length === 0 ? (
                  <p className="mt-2 text-sm text-slate-400">
                    Maaf, tidak ada slot tersedia untuk hari {day}.
                  </p>
                ) : (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {availableSlots.map((s) => (
                      <button
                        key={s.time}
                        type="button"
                        onClick={() => setTime(s.time)}
                        className={`inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                          time === s.time
                            ? "bg-primary-600 text-white"
                            : "bg-primary-50 text-primary-700 hover:bg-primary-100"
                        }`}
                      >
                        <Clock className="h-3.5 w-3.5" />
                        {s.time}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Detail acara */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="flex items-center gap-1 text-sm font-semibold text-slate-700">
                  <FileText className="h-3.5 w-3.5 text-primary-400" /> Nama Acara
                </label>
                <input
                  value={form.eventName}
                  onChange={(e) =>
                    setForm({ ...form, eventName: e.target.value })
                  }
                  placeholder="Mis. Kajian Tafsir Pekanan"
                  required
                  className="mt-2 w-full rounded-xl border border-sand-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="flex items-center gap-1 text-sm font-semibold text-slate-700">
                  <Users className="h-3.5 w-3.5 text-primary-400" /> Estimasi Jamaah
                </label>
                <input
                  value={form.audience}
                  onChange={(e) =>
                    setForm({ ...form, audience: e.target.value })
                  }
                  placeholder="Mis. 50 orang"
                  className="mt-2 w-full rounded-xl border border-sand-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
            </div>

            {/* Lokasi acara dengan map picker */}
            <div>
              <label className="flex items-center gap-1 text-sm font-semibold text-slate-700">
                <MapPin className="h-3.5 w-3.5 text-primary-400" /> Lokasi Acara
              </label>
              <input
                value={form.location}
                onChange={(e) =>
                  setForm({ ...form, location: e.target.value })
                }
                placeholder="Nama lokasi, mis. Masjid Al-Huda, Jakarta"
                required
                className="mt-2 w-full rounded-xl border border-sand-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
              <div className="mt-3">
                <LocationPicker
                  value={eventLocation}
                  onChange={setEventLocation}
                  initialPos={{
                    lat: selectedUstadz.lat,
                    lng: selectedUstadz.lng,
                  }}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700">
                Catatan Tambahan
              </label>
              <input
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Mis. Tema kajian, dll."
                className="mt-2 w-full rounded-xl border border-sand-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>

            {/* Summary */}
            {day && time && (
              <div className="rounded-xl bg-primary-50 p-4 text-sm">
                <div className="font-semibold text-primary-800">Ringkasan</div>
                <div className="mt-1 text-primary-700">
                  {selectedUstadz.title} {selectedUstadz.name} • {day} • {time}
                </div>
                <div className="text-primary-600">
                  Honor: {formatRupiah(selectedUstadz.fee)}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={!day || !time || !eventLocation || !verified}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-sand-300"
            >
              <ShieldCheck className="h-5 w-5" />
              Kirim Undangan Booking
            </button>
            {!verified && (
              <p className="text-center text-xs text-amber-600">
                Verifikasi nomor WhatsApp di atas untuk mengaktifkan tombol kirim.
              </p>
            )}
            {!eventLocation && day && time && (
              <p className="text-center text-xs text-amber-600">
                Pilih lokasi acara pada peta di atas untuk mengaktifkan tombol kirim.
              </p>
            )}
            {guardError && (
              <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <div className="font-semibold">Booking ditolak</div>
                  <div className="mt-0.5">{guardError}</div>
                </div>
              </div>
            )}
          </form>

          {/* Riwayat */}
          <div className="rounded-2xl border border-sand-200 bg-white p-6">
            <h3 className="flex items-center gap-1.5 font-semibold text-slate-800">
              <History className="h-4 w-4 text-primary-500" />
              Riwayat Booking
            </h3>
            {bookings.length === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-sand-200 py-8 text-center">
                <CalendarCheck className="mx-auto h-8 w-8 text-sand-300" />
                <p className="mt-2 text-sm text-slate-400">
                  Belum ada booking. Mulai buat undangan!
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {bookings.map((b) => {
                  const badge =
                    b.status === "pending"
                      ? "bg-amber-100 text-amber-700"
                      : b.status === "confirmed"
                        ? "bg-green-100 text-green-700"
                        : b.status === "cancelled"
                          ? "bg-red-100 text-red-600"
                          : "bg-slate-100 text-slate-600";
                  const label =
                    b.status === "pending"
                      ? "Menunggu Konfirmasi"
                      : b.status === "confirmed"
                        ? "Dikonfirmasi"
                        : b.status === "cancelled"
                          ? "Dibatalkan"
                          : "Selesai";
                  const canCancel =
                    b.status === "pending" || b.status === "confirmed";
                  return (
                    <div
                      key={b.id}
                      className="rounded-xl border border-sand-200 p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate font-semibold text-slate-800">
                          {b.ustadzName}
                        </span>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${badge}`}
                        >
                          {label}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {b.day} • {b.time}
                      </div>
                      <div className="text-xs text-slate-500">{b.eventName}</div>
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <Link
                          href={`/konsultasi?ustadz=${b.ustadzId}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:underline"
                        >
                          Lanjut chat <ArrowRight className="h-3 w-3" />
                        </Link>
                        <Link
                          href={`/tracking?booking=${b.id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
                        >
                          <Navigation className="h-3 w-3" />
                          Lihat Perjalanan
                        </Link>
                        {canCancel && (
                          <button
                            onClick={() => handleCancel(b.id)}
                            className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-red-500 hover:underline"
                          >
                            <XCircle className="h-3 w-3" />
                            Batalkan
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Success modal */}
        {success && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setSuccess(null)}
            />
            <div className="relative w-full max-w-md animate-fade-in-up rounded-2xl bg-white p-6 text-center shadow-xl">
              <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="mt-4 font-display text-xl font-bold text-slate-800">
                Undangan Terkirim!
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Booking untuk <strong>{success.ustadzName}</strong> pada{" "}
                <strong>{success.day}, {success.time}</strong> telah dibuat.
                Ustadz akan mengkonfirmasi via chat.
              </p>
              <div className="mt-5 space-y-2">
                <div className="flex gap-2">
                  <button
                    onClick={() => setSuccess(null)}
                    className="flex-1 rounded-xl border border-sand-200 py-2.5 text-sm font-medium text-slate-600"
                  >
                    Tutup
                  </button>
                  <Link
                    href={`/konsultasi?ustadz=${success.ustadzId}`}
                    className="flex-1 rounded-xl bg-primary-600 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"
                  >
                    Chat Ustadz
                  </Link>
                </div>
                {success.id && (
                  <Link
                    href={`/tracking?booking=${success.id}`}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-teal-600 py-2.5 text-sm font-semibold text-white hover:bg-teal-700"
                  >
                    <Navigation className="h-4 w-4" />
                    Lihat Perjalanan Ustadz/Ustadzah
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

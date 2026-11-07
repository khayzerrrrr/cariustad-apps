"use client";

/**
 * VerificationModal — Popup verifikasi nomor WhatsApp (simulasi OTP)
 * sebelum booking dibuat. Dipanggil saat user menekan "Kirim Undangan
 * Booking" namun belum terverifikasi. Setelah sukses, booking langsung
 * dilanjutkan otomatis oleh parent.
 *
 * Produksi: kode OTP dikirim via WhatsApp/SMS gateway — tidak pernah
 * ditampilkan di layar.
 */

import { useState } from "react";
import {
  ShieldCheck,
  Smartphone,
  X,
  CheckCircle2,
  AlertTriangle,
  BadgeCheck,
} from "lucide-react";
import { setVerifiedPhone } from "@/lib/storage";
import { generateOtp, isValidPhone, normalizePhone } from "@/lib/bookingGuard";

export default function VerificationModal({
  open,
  onClose,
  onVerified,
}: {
  open: boolean;
  onClose: () => void;
  /** Dipanggil dengan nomor ternormalisasi setelah verifikasi sukses. */
  onVerified: (phone: string) => void;
}) {
  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpDemo, setOtpDemo] = useState<string | null>(null);
  const [otpInput, setOtpInput] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (!open) return null;

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
      const normalized = normalizePhone(phone);
      setVerifiedPhone(normalized);
      setOtpError(null);
      setDone(true);
      // Kasih jeda singkat agar user melihat state sukses, lalu lanjut.
      setTimeout(() => onVerified(normalized), 700);
    } else {
      setOtpError("Kode verifikasi salah. Periksa kembali.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md animate-fade-in-up rounded-2xl bg-white p-6 shadow-xl">
        <button
          onClick={onClose}
          aria-label="Tutup"
          className="absolute right-4 top-4 text-slate-500 hover:text-slate-600"
        >
          <X className="h-5 w-5" />
        </button>

        {done ? (
          <div className="py-6 text-center">
            <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
              <BadgeCheck className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="mt-4 font-display text-xl font-bold text-slate-800">
              Nomor Terverifikasi!
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Undangan Anda sedang diproses...
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary-50">
                <ShieldCheck className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-slate-800">
                  Verifikasi Nomor WhatsApp
                </h3>
                <p className="text-xs text-slate-500">
                  Langkah keamanan sebelum undangan dibuat
                </p>
              </div>
            </div>

            <p className="mt-4 text-sm text-slate-600">
              Nomor terverifikasi dipakai ustadz menghubungi Anda dan mencegah
              undangan palsu.{" "}
              <span className="font-semibold text-slate-700">
                Satu nomor = satu pemesan.
              </span>
            </p>

            <div className="mt-4 flex gap-2">
              <div className="relative flex-1">
                <Smartphone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="08xxxxxxxxxx"
                  disabled={otpSent}
                  inputMode="tel"
                  autoFocus
                  className="w-full rounded-lg border border-sand-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:bg-sand-100"
                />
              </div>
              {!otpSent ? (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  className="shrink-0 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"
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
                  className="shrink-0 rounded-lg border border-sand-200 px-3 py-2.5 text-xs font-medium text-slate-500 hover:bg-sand-50"
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
              <div className="mt-4 space-y-2">
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                  <strong>Mode demo:</strong> kode verifikasi Anda{" "}
                  <span className="font-mono text-sm font-bold">{otpDemo}</span>{" "}
                  — di produksi dikirim via WhatsApp.
                </div>
                <div className="flex gap-2">
                  <input
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleVerifyOtp()}
                    placeholder="Masukkan 6 digit kode"
                    inputMode="numeric"
                    maxLength={6}
                    autoFocus
                    className="flex-1 rounded-lg border border-sand-200 bg-white px-3 py-2.5 font-mono text-sm tracking-widest text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Verifikasi
                  </button>
                </div>
              </div>
            )}

            <p className="mt-4 flex items-center gap-1.5 text-[11px] text-slate-500">
              <ShieldCheck className="h-3 w-3" />
              Nomor Anda hanya dipakai untuk konfirmasi undangan — tidak
              dibagikan ke pihak lain.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

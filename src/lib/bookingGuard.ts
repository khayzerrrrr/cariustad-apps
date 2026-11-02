/**
 * Booking Guard — Lapisan anti-abuse untuk booking jadwal ustadz.
 *
 * Melindungi ustadz dari orang iseng: spam booking, menahan slot
 * tanpa konfirmasi, dan pola cancel-no-show. Semua aturan murni
 * (pure function) agar mudah diuji dan bisa dipakai UI maupun AI Agent.
 *
 * Catatan produksi: di produksi identitas "user" = nomor HP terverifikasi
 * (OTP WhatsApp/SMS). Di demo ini identitas perangkat = user.
 */

/**
 * Bentuk minimal booking yang dibutuhkan guard — sengaja tidak mengimpor
 * `types.ts` agar modul ini mandiri dan bisa diuji langsung via Node
 * (node --experimental-strip-types) tanpa path alias.
 */
export interface BookingLike {
  id?: string;
  ustadzId: string;
  ustadzName: string;
  day: string;
  time: string;
  status: string;
  createdAt: string;
}

// ── Konfigurasi aturan ──────────────────────────────────────────────

export const BOOKING_RULES = {
  /** Maksimal booking berstatus pending per user (mencegah "tahan kursi"). */
  maxPendingBookings: 3,
  /** Maksimal booking dibuat dalam 1 jam terakhir (mencegah spam burst). */
  maxBookingsPerHour: 5,
  /** Cooldown (menit) setelah membatalkan booking untuk ustadz yang sama. */
  cancelCooldownMinutes: 120,
  /** Batas cancel mendadak yang memicu status "perlu review manual". */
  maxLateCancels: 3,
} as const;

export type BookingRejectCode =
  | "duplicate_slot"
  | "pending_limit"
  | "rate_limit"
  | "cancel_cooldown"
  | "ustadz_unavailable";

export interface BookingGuardResult {
  allowed: boolean;
  code?: BookingRejectCode;
  /** Pesan ramah pengguna dalam Bahasa Indonesia. */
  reason?: string;
  /** Detail tambahan untuk audit log. */
  meta?: Record<string, unknown>;
}

function parseCreatedAt(iso: string): number {
  const t = Date.parse(iso);
  return Number.isNaN(t) ? 0 : t;
}

/** Booking yang masih "memegang" slot (bukan cancelled/completed). */
export function isSlotHoldingStatus(b: BookingLike): boolean {
  return b.status === "pending" || b.status === "confirmed";
}

/**
 * Cek kelayakan booking baru terhadap seluruh riwayat booking user.
 * Dipanggil sebelum addBooking, baik dari halaman /booking maupun AI Agent.
 */
export function checkBooking(
  existing: BookingLike[],
  candidate: Pick<BookingLike, "ustadzId" | "day" | "time"> & {
    createdAt?: string;
  },
  now: number = Date.now()
): BookingGuardResult {
  const createdAt = candidate.createdAt
    ? parseCreatedAt(candidate.createdAt)
    : now;

  // 1. Slot sama sudah dipegang → tolak (anti double-booking & tahan kursi).
  const duplicate = existing.find(
    (b) =>
      b.ustadzId === candidate.ustadzId &&
      b.day === candidate.day &&
      b.time === candidate.time &&
      isSlotHoldingStatus(b)
  );
  if (duplicate) {
    return {
      allowed: false,
      code: "duplicate_slot",
      reason: `Slot ${candidate.day}, ${candidate.time} untuk ${duplicate.ustadzName} sudah ada booking yang menunggu konfirmasi. Pilih slot lain atau pantau booking Anda yang ada.`,
      meta: { duplicateId: duplicate.id },
    };
  }

  // 2. Batas booking pending per user.
  const pending = existing.filter(isSlotHoldingStatus);
  if (pending.length >= BOOKING_RULES.maxPendingBookings) {
    return {
      allowed: false,
      code: "pending_limit",
      reason: `Anda sudah memiliki ${pending.length} booking yang menunggu konfirmasi. Batas maksimal ${BOOKING_RULES.maxPendingBookings} booking aktif. Selesaikan atau batalkan booking lama terlebih dahulu.`,
      meta: { pendingCount: pending.length },
    };
  }

  // 3. Rate limit: terlalu banyak booking dalam 1 jam terakhir.
  const recent = existing.filter(
    (b) => createdAt - parseCreatedAt(b.createdAt) < 60 * 60 * 1000
  );
  if (recent.length >= BOOKING_RULES.maxBookingsPerHour) {
    return {
      allowed: false,
      code: "rate_limit",
      reason: `Aktivitas booking terdeteksi tidak wajar (lebih dari ${BOOKING_RULES.maxBookingsPerHour} booking dalam 1 jam). Coba lagi beberapa saat lagi.`,
      meta: { recentCount: recent.length },
    };
  }

  // 4. Cooldown setelah cancel: kasih jeda bagi ustadz yang baru dibatalkan.
  const lastCancel = existing
    .filter(
      (b) =>
        b.ustadzId === candidate.ustadzId && b.status === "cancelled"
    )
    .sort(
      (a, b) => parseCreatedAt(b.createdAt) - parseCreatedAt(a.createdAt)
    )[0];
  if (lastCancel) {
    const elapsedMin =
      (createdAt - parseCreatedAt(lastCancel.createdAt)) / 60000;
    if (elapsedMin < BOOKING_RULES.cancelCooldownMinutes) {
      const sisa = Math.ceil(
        BOOKING_RULES.cancelCooldownMinutes - elapsedMin
      );
      return {
        allowed: false,
        code: "cancel_cooldown",
        reason: `Anda baru saja membatalkan booking dengan ${lastCancel.ustadzName}. Tunggu ${sisa} menit lagi sebelum booking ulang ustadz yang sama.`,
        meta: { cooldownRemainingMin: sisa },
      };
    }
  }

  return { allowed: true };
}

/**
 * Skor kepercayaan user (0-100) berdasarkan riwayat.
 * Dipakai untuk badge reputasi & keputusan "perlu review manual".
 */
export function getTrustScore(existing: BookingLike[]): {
  score: number;
  needsReview: boolean;
  completed: number;
  cancelled: number;
} {
  const completed = existing.filter((b) => b.status === "completed").length;
  const cancelled = existing.filter((b) => b.status === "cancelled").length;
  const noShowRisk = Math.max(0, cancelled - completed);
  const score = Math.max(0, Math.min(100, 100 - noShowRisk * 25));
  return {
    score,
    needsReview: cancelled >= BOOKING_RULES.maxLateCancels,
    completed,
    cancelled,
  };
}

/**
 * Hasilkan kode OTP demo 6 digit.
 * Di produksi, kode ini dikirim via WhatsApp/SMS gateway — tidak pernah
 * ditampilkan di UI.
 */
export function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/** Validasi format nomor HP Indonesia (08xx / +62). */
export function isValidPhone(phone: string): boolean {
  return /^(\+62|62|0)8[1-9][0-9]{6,10}$/.test(phone.replace(/[\s-]/g, ""));
}

/** Normalisasi nomor HP ke format 08xx... untuk deduplikasi. */
export function normalizePhone(phone: string): string {
  const p = phone.replace(/[\s-]/g, "");
  if (p.startsWith("+62")) return "0" + p.slice(3);
  if (p.startsWith("62")) return "0" + p.slice(2);
  return p;
}

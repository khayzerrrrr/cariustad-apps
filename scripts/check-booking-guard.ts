/**
 * check-booking-guard.ts — Pengujian lapisan anti-abuse booking.
 * Jalankan: npm run test:bookingguard  (lokal, tanpa jaringan)
 */

import {
  checkBooking,
  getTrustScore,
  generateOtp,
  isValidPhone,
  normalizePhone,
  BOOKING_RULES,
} from "../src/lib/bookingGuard.ts";
import type { Booking } from "../src/lib/types.ts";

let passed = 0;
let failed = 0;

function check(name: string, cond: boolean, detail?: string) {
  if (cond) {
    passed++;
    console.log(`  ✅ ${name}`);
  } else {
    failed++;
    console.error(`  ❌ ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

function mkBooking(
  over: Partial<Booking> & { ustadzId: string }
): Booking {
  return {
    id: `b_${Math.random().toString(36).slice(2, 8)}`,
    ustadzName: "Ustadz Uji",
    day: "Senin",
    time: "19:00 - 21:00",
    eventName: "Kajian",
    location: "Masjid",
    audience: "-",
    notes: "",
    status: "pending",
    createdAt: new Date().toISOString(),
    ...over,
  } as Booking;
}

const NOW = Date.parse("2026-11-02T10:00:00Z");
const ago = (min: number) => new Date(NOW - min * 60000).toISOString();

console.log("\n━━━ 1. Slot duplikat ━━━");
{
  const existing = [mkBooking({ ustadzId: "u1" })];
  const r = checkBooking(existing, { ustadzId: "u1", day: "Senin", time: "19:00 - 21:00" }, NOW);
  check("Slot sama ditolak", !r.allowed && r.code === "duplicate_slot", JSON.stringify(r));
  check("Pesan menyebut slot", r.reason?.includes("Senin") === true);
}
{
  const existing = [mkBooking({ ustadzId: "u1", status: "cancelled" })];
  const r = checkBooking(existing, { ustadzId: "u1", day: "Senin", time: "19:00 - 21:00" }, NOW);
  check("Slot yang dibatalkan boleh dibooking ulang (belum masuk cooldown)", r.allowed, JSON.stringify(r));
}
{
  const existing = [mkBooking({ ustadzId: "u1" })];
  const r = checkBooking(existing, { ustadzId: "u2", day: "Senin", time: "19:00 - 21:00" }, NOW);
  check("Slot sama di ustadz berbeda tetap boleh", r.allowed, JSON.stringify(r));
}

console.log("\n━━━ 2. Batas booking pending ━━━");
{
  const existing = Array.from({ length: BOOKING_RULES.maxPendingBookings }, (_, i) =>
    mkBooking({ ustadzId: `u${i}`, day: "Selasa" })
  );
  const r = checkBooking(existing, { ustadzId: "u9", day: "Rabu", time: "08:00 - 10:00" }, NOW);
  check(`Batas ${BOOKING_RULES.maxPendingBookings} pending ditegakkan`, !r.allowed && r.code === "pending_limit", JSON.stringify(r));
}
{
  const existing = Array.from({ length: BOOKING_RULES.maxPendingBookings }, (_, i) =>
    mkBooking({ ustadzId: `u${i}`, day: "Selasa", status: "completed" })
  );
  const r = checkBooking(existing, { ustadzId: "u9", day: "Rabu", time: "08:00 - 10:00" }, NOW);
  check("Booking selesai tidak dihitung sebagai pending", r.allowed, JSON.stringify(r));
}

console.log("\n━━━ 3. Rate limit per jam ━━━");
{
  const existing = Array.from({ length: BOOKING_RULES.maxBookingsPerHour }, (_, i) =>
    mkBooking({ ustadzId: `u${i}`, day: `Hari${i}`, status: "completed", createdAt: ago(30) })
  );
  const r = checkBooking(existing, { ustadzId: "u9", day: "Rabu", time: "08:00 - 10:00", createdAt: ago(0) }, NOW);
  check(`${BOOKING_RULES.maxBookingsPerHour} booking dalam 1 jam ditolak`, !r.allowed && r.code === "rate_limit", JSON.stringify(r));
}
{
  const existing = Array.from({ length: BOOKING_RULES.maxBookingsPerHour }, (_, i) =>
    mkBooking({ ustadzId: `u${i}`, day: `Hari${i}`, status: "completed", createdAt: ago(90) })
  );
  const r = checkBooking(existing, { ustadzId: "u9", day: "Rabu", time: "08:00 - 10:00" }, NOW);
  check("Booking >1 jam lalu tidak memicu rate limit", r.allowed, JSON.stringify(r));
}

console.log("\n━━━ 4. Cooldown setelah cancel ━━━");
{
  const existing = [mkBooking({ ustadzId: "u1", status: "cancelled", createdAt: ago(60) })];
  const r = checkBooking(existing, { ustadzId: "u1", day: "Senin", time: "19:00 - 21:00" }, NOW);
  check(`Cooldown ${BOOKING_RULES.cancelCooldownMinutes} menit aktif`, !r.allowed && r.code === "cancel_cooldown", JSON.stringify(r));
  check("Pesan menyebut sisa waktu", r.reason?.includes("menit") === true);
}
{
  const existing = [mkBooking({ ustadzId: "u1", status: "cancelled", createdAt: ago(130) })];
  const r = checkBooking(existing, { ustadzId: "u1", day: "Senin", time: "19:00 - 21:00" }, NOW);
  check("Booking ulang setelah cooldown lewat diperbolehkan", r.allowed, JSON.stringify(r));
}
{
  const existing = [mkBooking({ ustadzId: "u2", status: "cancelled", createdAt: ago(10) })];
  const r = checkBooking(existing, { ustadzId: "u1", day: "Senin", time: "19:00 - 21:00" }, NOW);
  check("Cancel di ustadz lain tidak mengganggu ustadz ini", r.allowed, JSON.stringify(r));
}

console.log("\n━━━ 5. Alur normal ━━━");
{
  const r = checkBooking([], { ustadzId: "u1", day: "Senin", time: "19:00 - 21:00" }, NOW);
  check("Riwayat kosong → booking lolos", r.allowed);
}

console.log("\n━━━ 6. Trust score ━━━");
{
  const t = getTrustScore([]);
  check("Riwayat kosong → skor 100", t.score === 100 && !t.needsReview);
  const t2 = getTrustScore([
    mkBooking({ ustadzId: "u1", status: "completed" }),
    mkBooking({ ustadzId: "u2", status: "completed" }),
  ]);
  check("2 selesai, 0 batal → skor 100", t2.score === 100);
  const t3 = getTrustScore([
    mkBooking({ ustadzId: "u1", status: "cancelled" }),
    mkBooking({ ustadzId: "u2", status: "cancelled" }),
    mkBooking({ ustadzId: "u3", status: "cancelled" }),
  ]);
  check("3 batal tanpa selesai → butuh review", t3.needsReview && t3.score === 25, JSON.stringify(t3));
}

console.log("\n━━━ 7. OTP & nomor HP ━━━");
{
  const otp = generateOtp();
  check("OTP 6 digit", /^\d{6}$/.test(otp), otp);
  check("081234567890 valid", isValidPhone("081234567890"));
  check("+6281234567890 valid", isValidPhone("+6281234567890"));
  check("0812-3456-7890 valid (dengan tanda hubung)", isValidPhone("0812-3456-7890"));
  check("12345 tidak valid", !isValidPhone("12345"));
  check("08123 tidak valid (terlalu pendek)", !isValidPhone("08123"));
  check("Normalisasi +62 → 0", normalizePhone("+6281234567890") === "081234567890");
  check("Normalisasi 62 → 0", normalizePhone("6281234567890") === "081234567890");
}

console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log(`Hasil: ${passed} lulus, ${failed} gagal`);
process.exit(failed > 0 ? 1 : 0);

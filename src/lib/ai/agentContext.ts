/**
 * Memori percakapan agent.
 *
 * Dibawa bolak-balik antara klien dan server supaya pertanyaan lanjutan
 * seperti "yang lebih murah", "di Bandung saja", atau "setuju" tetap
 * nyambung dengan konteks sebelumnya.
 */

import type { ParsedBookingRequest } from "./bookingParser";

export interface AgentContext {
  /** Jumlah giliran percakapan */
  turn: number;
  /** Kota yang terakhir disebut */
  city?: string;
  /** Spesialisasi yang terakhir disebut */
  specialization?: string;
  /** ID ustadz dari hasil pencarian terakhir */
  lastUstadzIds?: string[];
  /** Aksi terakhir yang dijalankan agent */
  lastAction?: string;
  /** Draf booking yang sedang menunggu persetujuan */
  pendingBooking?: ParsedBookingRequest | null;
  /** Ustadz yang diusulkan pada draf booking */
  pendingUstadzId?: string;
  pendingUstadzName?: string;
  /** true = agent sedang menunggu kata "setuju" / "batal" */
  awaitingConfirmation?: boolean;
}

export const EMPTY_CONTEXT: AgentContext = { turn: 0 };

/** Bersihkan konteks setelah booking selesai/dibatalkan. */
export function clearPendingBooking(ctx: AgentContext): AgentContext {
  return {
    ...ctx,
    pendingBooking: null,
    pendingUstadzId: undefined,
    pendingUstadzName: undefined,
    awaitingConfirmation: false,
  };
}

/** Kata-kata yang berarti "lanjutkan / setujui". */
const CONFIRM_WORDS = [
  "setuju",
  "saya setuju",
  "ok",
  "oke",
  "okey",
  "ya",
  "yaa",
  "yup",
  "lanjut",
  "lanjutkan",
  "konfirmasi",
  "benar",
  "betul",
  "gas",
  "silakan",
  "proses",
];

/** Kata-kata yang berarti "batalkan". */
const CANCEL_WORDS = [
  "batal",
  "batalkan",
  "jangan",
  "tidak",
  "gak",
  "nggak",
  "tidak jadi",
  "gak jadi",
  "stop",
];

export function isConfirmation(message: string): boolean {
  const m = ` ${message.toLowerCase().trim()} `;
  // Pesan panjang biasanya bukan sekadar konfirmasi
  if (m.trim().split(/\s+/).length > 4) return false;
  return CONFIRM_WORDS.some((w) => m.includes(` ${w} `) || m.trim() === w);
}

export function isCancellation(message: string): boolean {
  const m = ` ${message.toLowerCase().trim()} `;
  if (m.trim().split(/\s+/).length > 4) return false;
  return CANCEL_WORDS.some((w) => m.includes(` ${w} `) || m.trim() === w);
}

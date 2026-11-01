/**
 * Perangkum hasil pencarian terverifikasi untuk dikirim ke LLM.
 *
 * LLM tidak lagi memfilter katalog sendiri — ia hanya menuliskan ulang
 * baris-baris yang sudah disaring mesin lokal. Ini mencegah kesalahan
 * seperti ustadz Bogor ikut masuk daftar "ustadz di Jakarta", dan sekaligus
 * memangkas token karena hanya baris relevan yang dikirim.
 */

import { Ustadz } from "@/lib/types";
import { formatRupiah } from "@/lib/storage";

export function formatVerifiedRows(list: Ustadz[]): string {
  return list
    .map((u, i) => {
      const free = u.schedule
        .map((d) => ({
          day: d.day,
          slots: d.slots.filter((s) => !s.booked).map((s) => s.time),
        }))
        .filter((d) => d.slots.length > 0)
        .map((d) => `${d.day} (${d.slots.join(", ")})`)
        .join("; ");

      return [
        `${i + 1}. ${u.title} ${u.name}`,
        `   bidang: ${u.specializations.join(", ")}`,
        `   lokasi: ${u.area}, ${u.city}`,
        `   rating: ${u.rating}/5 dari ${u.reviewCount} ulasan`,
        `   pengalaman: ${u.experience} tahun`,
        `   biaya: ${formatRupiah(u.fee)}`,
        `   status: ${u.available ? "tersedia" : "sedang tidak tersedia"}`,
        free ? `   slot kosong: ${free}` : `   slot kosong: tidak ada`,
      ].join("\n");
    })
    .join("\n\n");
}

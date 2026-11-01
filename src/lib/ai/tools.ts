import { ustadzData, kajianData } from "@/lib/data";
import { ALL_SPECIALIZATIONS, ALL_CITIES, Ustadz, Kajian } from "@/lib/types";
import { ALL_PROVINCES } from "@/lib/regions";
import { formatRupiah } from "@/lib/storage";

export interface SearchResult {
  ustadz?: Ustadz;
  list?: Ustadz[];
  kajian?: Kajian[];
  text: string;
}

/** Cari ustadz berdasarkan teks bebas (nama, kota, spesialisasi) */
export function searchUstadz(query: string): SearchResult {
  const q = query.toLowerCase().trim();

  // Cek kota
  const cityMatch = ALL_CITIES.find((c) =>
    c.toLowerCase().includes(q) || q.includes(c.toLowerCase())
  );
  if (cityMatch) {
    const list = ustadzData.filter((u) => u.city === cityMatch);
    return {
      list,
      text: `Saya menemukan ${list.length} ustadz di ${cityMatch}. Berikut rekomendasinya:\n\n` +
        list
          .map(
            (u) =>
              `- ${u.title} ${u.name} (${u.credentials}) — ${u.specializations.join(", ")} | Rating: ${u.rating} | ${formatRupiah(u.fee)}`
          )
          .join("\n"),
    };
  }

  // Cek spesialisasi
  const specMatch = ALL_SPECIALIZATIONS.find((s) =>
    s.toLowerCase().includes(q) || q.includes(s.toLowerCase())
  );
  if (specMatch) {
    const list = ustadzData.filter((u) => u.specializations.includes(specMatch));
    return {
      list,
      text: `Untuk bidang ${specMatch}, ada ${list.length} ustadz yang tersedia:\n\n` +
        list
          .map(
            (u) =>
              `- ${u.title} ${u.name} — ${u.city}, ${u.area} | Rating: ${u.rating} | ${u.experience} tahun pengalaman`
          )
          .join("\n"),
    };
  }

  // Cek nama
  const nameMatch = ustadzData.filter((u) =>
    u.name.toLowerCase().includes(q)
  );
  if (nameMatch.length > 0) {
    if (nameMatch.length === 1) {
      const u = nameMatch[0];
      return {
        ustadz: u,
        text: formatUstadzProfile(u),
      };
    }
    return {
      list: nameMatch,
      text: `Saya menemukan ${nameMatch.length} ustadz dengan nama tersebut:\n\n` +
        nameMatch.map((u) => `- ${u.title} ${u.name} — ${u.city}`).join("\n"),
    };
  }

  return { text: "" };
}

/** Format profil ustadz untuk display */
export function formatUstadzProfile(u: Ustadz): string {
  const schedule = u.schedule
    .map((d) => {
      const free = d.slots.filter((s) => !s.booked).map((s) => s.time);
      return `${d.day}: ${free.length > 0 ? free.join(", ") : "Penuh"}`;
    })
    .join("\n");

  return `Berikut profil ${u.title} ${u.name}:

- Kredensial: ${u.credentials}
- Spesialisasi: ${u.specializations.join(", ")}
- Lokasi: ${u.area}, ${u.city}
- Pengalaman: ${u.experience} tahun
- Rating: ${u.rating}/5 (${u.reviewCount} ulasan)
- Biaya: ${formatRupiah(u.fee)}
- Status: ${u.available ? "Tersedia" : "Sedang tidak tersedia"}
- Alma Mater: ${u.almaMater}

Jadwal:\n${schedule}

${u.bio}

Anda dapat booking ${u.title} ${u.name} melalui halaman Booking atau menghubungi via WhatsApp di halaman Konsultasi.`;
}

/** Rekomendasi ustadz berdasarkan kebutuhan */
export function recommendUstadz(query?: string): SearchResult {
  let list = [...ustadzData].sort((a, b) => b.rating - a.rating);

  if (query) {
    const q = query.toLowerCase();
    // Filter by specialization if mentioned
    const spec = ALL_SPECIALIZATIONS.find((s) =>
      q.includes(s.toLowerCase())
    );
    if (spec) {
      list = list.filter((u) => u.specializations.includes(spec));
    }
    // Filter by city if mentioned
    const city = ALL_CITIES.find((c) => q.includes(c.toLowerCase()));
    if (city) {
      list = list.filter((u) => u.city === city);
    }
  }

  const top = list.slice(0, 5);
  return {
    list: top,
    text: `Berikut ${top.length} ustadz dengan rating tertinggi yang saya rekomendasikan:\n\n` +
      top
        .map(
          (u, i) =>
            `${i + 1}. ${u.title} ${u.name} (${u.credentials})\n   ${u.specializations.join(", ")} | ${u.city} | Rating ${u.rating} | ${formatRupiah(u.fee)}`
        )
        .join("\n\n"),
  };
}

/** Cari kajian mendatang */
export function searchKajian(query?: string): SearchResult {
  let list = [...kajianData].sort((a, b) => a.date.localeCompare(b.date));

  if (query) {
    const q = query.toLowerCase();
    list = list.filter(
      (k) =>
        k.title.toLowerCase().includes(q) ||
        k.topic.toLowerCase().includes(q) ||
        k.city.toLowerCase().includes(q) ||
        k.eventType.toLowerCase().includes(q)
    );
  }

  return {
    kajian: list,
    text: `Berikut kajian mendatang yang tersedia:\n\n` +
      list
        .map((k) => {
          const ustadz = ustadzData.find((u) => u.id === k.ustadzId);
          return `- ${k.title}\n  ${k.date} ${k.time} | ${k.location}, ${k.city}\n  Ustadz: ${ustadz?.title} ${ustadz?.name}\n  ${k.price === "Gratis" ? "Gratis" : formatRupiah(k.fee || 0)}`;
        })
        .join("\n\n"),
  };
}

/** Semua ustadz tersedia */
export function listAllUstadz(): SearchResult {
  return {
    list: ustadzData,
    text: `Platform CariUstadz saat ini memiliki ${ustadzData.length} ustadz & ustadzah terverifikasi di ${ALL_CITIES.length} kota, ${ALL_PROVINCES.length} provinsi — dari Aceh sampai Papua. Anda bisa mencari berdasarkan:\n\n- Spesialisasi: ${ALL_SPECIALIZATIONS.slice(0, 5).join(", ")}...\n- Kota atau provinsi (mis. "di Sumatera", "di Sulawesi Selatan")\n- Nama ustadz\n\nSilakan beritahu saya kebutuhan Anda, dan saya akan bantu mencarikan ustadz yang tepat.`,
  };
}

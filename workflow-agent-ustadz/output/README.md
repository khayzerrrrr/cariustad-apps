# output/ — Hasil Eksekusi (ditulis HANYA setelah persetujuan)

Folder ini kosong dengan sengaja.

- Agen hanya boleh menulis di sini **setelah** pengguna menjawab "setuju"
  pada rencana/preview.
- Setiap booking menghasilkan satu file `booking-YYYYMMDD-HHMM.json`.
- Semua langkah (terjawab, ditolak, diblokir) dicatat di `audit-log.md`.

Format `booking-*.json`:

```json
{
  "dibuat": "2026-11-03T10:00:00+07:00",
  "status": "confirmed",
  "persetujuan": "diberikan oleh pengguna di chat WorkBuddy",
  "ustadz": { "id": "u-001", "name": "Ahmad Fauzi Rahman" },
  "acara": { "jenis": "Kajian", "hari": "Senin", "waktu": "19:00-21:00", "kota": "Bandung", "jemaah": 50 },
  "pemeriksaan_budaya": { "salatJumat": "lulus", "waktuSalat": "lulus" },
  "dasar_rekomendasi": "rating 4.9/5 (87 ulasan), spesialisasi Fiqih"
}
```

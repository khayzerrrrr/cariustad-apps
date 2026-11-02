#!/usr/bin/env node
/**
 * cari.mjs — mesin pencari dalil MANDIRI (tanpa AI, tanpa dependensi).
 *
 * Membaca dalil.json di folder yang sama dan menjawab pertanyaan dengan
 * kutipan ayat/hadis terverifikasi — persis logika yang dipakai Mode
 * Ustadz Hafizh di web, tapi bisa jalan di terminal mana pun yang punya
 * Node.js ≥ 18. Tidak butuh kunci API, tidak butuh jaringan.
 *
 * Pemakaian:
 *   node cari.mjs "apa dalil tentang sabar"
 *   node cari.mjs --json "keutamaan sedekah"   # keluaran JSON (untuk bot/skrip)
 *   node cari.mjs --daftar                     # daftar semua kutipan
 *   node cari.mjs --topik                      # daftar topik yang tersedia
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const db = JSON.parse(readFileSync(join(here, "dalil.json"), "utf-8"));
const DATA = db.entries;

function normalize(text) {
  return ` ${text.toLowerCase().replace(/\s+/g, " ").trim()} `;
}

/** Skor kecocokan topik — logika sama dengan src/lib/ai/dalilKnowledge.ts */
function findDalil(message) {
  const msg = normalize(message);
  return DATA.map((d) => ({
    entry: d,
    score: d.topics.reduce(
      (acc, t) => (msg.includes(` ${t}`) || msg.includes(`${t} `) ? acc + 1 : acc),
      0
    ),
  }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((x) => x.entry);
}

function formatEntry(d) {
  const grade = d.grade ? ` — derajat ${d.grade}` : "";
  const verify = d.verifyUrl ? `\n   Verifikasi: ${d.verifyUrl}` : "";
  return (
    `📖 ${d.citation}${grade}\n` +
    `   "${d.text}"\n\n` +
    `   Maknanya: ${d.meaning}\n\n` +
    `   Penerapan praktis: ${d.practice}` +
    verify
  );
}

function answerText(query) {
  const found = findDalil(query);
  if (found.length === 0) {
    return (
      `Belum ada dalil yang cocok di basis data (${DATA.length} kutipan terverifikasi).\n` +
      `Gunakan --topik untuk melihat topik yang tersedia.\n` +
      `Catatan: basis data ini hanya memuat kutipan shahih/hasan — tidak menebak.`
    );
  }
  const body = found.map(formatEntry).join("\n\n" + "-".repeat(56) + "\n\n");
  return body + `\n—\nSumber data: dalil-db (terverifikasi sunnah.com & quran.com). ` +
    `Untuk keputusan fikih, konsultasikan ke ustadz/ulama.`;
}

function answerJson(query) {
  const found = findDalil(query);
  return JSON.stringify(
    { query, count: found.length, results: found },
    null,
    2
  );
}

function listAll() {
  const lines = DATA.map((d, i) => {
    const grade = d.grade ? ` (${d.grade})` : "";
    return `${String(i + 1).padStart(2)}. ${d.citation}${grade} — ${d.text.slice(0, 72)}…`;
  });
  return `${DATA.length} kutipan terverifikasi:\n\n${lines.join("\n")}`;
}

function listTopics() {
  const topics = [...new Set(DATA.flatMap((d) => d.topics))].sort();
  return `Topik tersedia (${topics.length}):\n\n• ${topics.join("\n• ")}`;
}

/* ------------------------- argument parsing ------------------------- */

const args = process.argv.slice(2);
const flags = args.filter((a) => a.startsWith("--"));
const query = args.filter((a) => !a.startsWith("--")).join(" ");

if (flags.includes("--daftar") || flags.includes("--list")) {
  console.log(listAll());
} else if (flags.includes("--topik") || flags.includes("--topics")) {
  console.log(listTopics());
} else if (!query.trim()) {
  console.log(
    `dalil-db v${db.version} — ${DATA.length} kutipan ayat/hadis terverifikasi\n\n` +
      `Pemakaian:\n` +
      `  node cari.mjs "<pertanyaan>"      jawab dengan dalil\n` +
      `  node cari.mjs --json "<pertanyaan>"  keluaran JSON (untuk bot/skrip)\n` +
      `  node cari.mjs --daftar            daftar semua kutipan\n` +
      `  node cari.mjs --topik             daftar topik\n\n` +
      `Contoh: node cari.mjs "apa dalil tentang sabar"`
  );
} else if (flags.includes("--json")) {
  console.log(answerJson(query));
} else {
  console.log(answerText(query));
}

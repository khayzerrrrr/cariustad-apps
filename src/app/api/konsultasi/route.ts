import { NextRequest, NextResponse } from "next/server";
import { generateReply, getProviderStatus } from "@/lib/ai/llmRouter";
import { checkScope, redactContactBeforeApproval } from "@/lib/ai/scopeGuard";
import { detectPromptInjection } from "@/lib/ai/promptGuard";
import { ustadzData } from "@/lib/data";
import type { Ustadz } from "@/lib/types";

/**
 * Konsultasi online dengan ustadz/ustadzah.
 *
 * Setiap ustadz/ustadzah diwakili persona AI yang dibangun dari profil
 * aslinya (nama, gelar, spesialisasi, kota, pengalaman, latar belakang
 * pendidikan). Pertanyaan keagamaan diizinkan (beda dengan /api/llm yang
 * menolak religious_ruling karena konteksnya pencarian layanan).
 *
 * Batas tetap ditegakkan: prompt injection ditolak, topik di luar Islam/
 * konsultasi ditolak, kontak pribadi disensor, dan persona TIDAK BOLEH
 * mengaku fatwa resmi — untuk masalah serius diarahkan ke konsultasi
 * langsung atau lembaga resmi.
 */

export const runtime = "nodejs";

function buildPersonaPrompt(u: Ustadz): string {
  const genderWord = u.gender === "P" ? "ustadzah" : "ustadz";
  return `Anda adalah ${u.title} ${u.name} (${u.credentials}), ${genderWord} di platform CariUstadz.

=== PROFIL ANDA (JANGAN MENGUBAH) ===
Nama: ${u.title} ${u.name}
Spesialisasi: ${u.specializations.join(", ")}
Domisili: ${u.city}, ${u.province} (area ${u.area})
Pengalaman: ${u.experience} tahun
Pendidikan: ${u.almaMater}
Tentang: ${u.bio}
Ini sesi konsultasi ONLINE melalui fitur chat CariUstadz.

=== CARA ANDA MENJAWAB (WAJIB) ===
- Bahasa Indonesia yang sopan, hangat, dan santun — seperti ${genderWord} yang mengobrol dengan jamaah.
- Jawab dari sudut pandang keilmuan Islam sesuai spesialisasi Anda (${u.specializations.join(", ")}).
- Jawab ringkas: 2 sampai 5 kalimat. Panjang hanya bila penanya meminta detail.
- Salam "Wa'alaikumussalam" HANYA bila penanya mengirim salam. Jangan pernah mengucapkan salam lebih dari sekali dalam percakapan, dan jangan membuka jawaban dengan salam bila tidak disapa.
- Jika pertanyaan di luar spesialisasi Anda, jawab seperlunya dengan hati-hati lalu sarankan bertanya kepada ${genderWord} yang spesialisasinya sesuai.
- JANGAN mengaku mewakili lembaga fatwa resmi. Untuk persoalan serius (perceraian, waris, kejiwaan, darurat), sarankan konsultasi langsung dengan ${genderWord}/ahli terkait atau lembaga resmi.
- JANGAN memberi nomor telepon, alamat email, atau media sosial pribadi (baik milik Anda maupun mengarang milik orang lain). Arahkan ke halaman booking CariUstadz untuk mengatur jadwal.
- JANGAN mengarang harga, jadwal, atau profil — data layanan ada di platform, bukan di sesi ini.
- Topik di luar Islam, konsultasi keluarga/keagamaan, atau kebutuhan acara: tolak dengan sopan satu-dua kalimat.
- Anda adalah simulasi persona untuk demo platform — jika ditanya "apakah Anda AI", jawab jujur bahwa ini fitur konsultasi berbantuan AI dari CariUstadz dan balasan mewakili gaya ${genderWord} tersebut.`;
}

export async function POST(req: NextRequest) {
  const status = getProviderStatus();
  if (!status.configured) {
    return NextResponse.json(
      {
        error: "not_configured",
        message:
          "Belum ada kunci LLM. Isi DEEPSEEK_API_KEY atau OPENROUTER_API_KEY di .env.local",
      },
      { status: 501 }
    );
  }

  let body: {
    ustadzId?: string;
    message?: string;
    history?: Array<{ role: "user" | "assistant"; content: string }>;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const { ustadzId, message } = body;
  if (!ustadzId || typeof ustadzId !== "string" || !message || typeof message !== "string") {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  if (message.length > 2000) {
    return NextResponse.json({ error: "message_too_long" }, { status: 413 });
  }

  const ustadz = ustadzData.find((x) => x.id === ustadzId);
  if (!ustadz) {
    return NextResponse.json({ error: "ustadz_not_found" }, { status: 404 });
  }

  // Prompt injection ditolak sebelum model dipanggil.
  const injection = detectPromptInjection(message);
  if (injection.isInjection) {
    return NextResponse.json(
      { error: "injection_blocked", patterns: injection.patterns },
      { status: 422 }
    );
  }

  // Batas domain: off_topic ditolak; religious_ruling JUSTRU diizinkan di sini.
  const scope = checkScope(message);
  if (scope.verdict === "off_topic") {
    return NextResponse.json(
      { error: "out_of_scope", scope: scope.verdict },
      { status: 422 }
    );
  }

  try {
    const result = await generateReply({
      systemPrompt: buildPersonaPrompt(ustadz),
      history: (body.history ?? []).slice(-8),
      userMessage: message,
    });

    if (!result.text) throw new Error("jawaban kosong");

    return NextResponse.json({
      reply: redactContactBeforeApproval(result.text, false),
      provider: result.provider,
      model: result.model,
      persona: `${ustadz.title} ${ustadz.name}`,
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : "kesalahan tidak dikenal";
    return NextResponse.json({ error: "llm_failed", detail }, { status: 502 });
  }
}

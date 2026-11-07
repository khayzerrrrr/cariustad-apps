import { NextRequest, NextResponse } from "next/server";
import { generateReply, getProviderStatus } from "@/lib/ai/llmRouter";
import {
  buildGroundedSystemPrompt,
  buildRulesPrompt,
} from "@/lib/ai/groundedPrompt";
import {
  checkScope,
  detectUnknownUstadzNames,
  redactContactBeforeApproval,
} from "@/lib/ai/scopeGuard";
import { buildHafizhSystemPrompt } from "@/lib/ai/expertHafizh";
import { detectPromptInjection } from "@/lib/ai/promptGuard";
import { ustadzData } from "@/lib/data";

/**
 * Gerbang LLM.
 *
 * Kunci API hanya hidup di server (variabel lingkungan), tidak pernah
 * dikirim ke browser. Rute ini juga menjaga batas domain: pertanyaan di
 * luar CariUstadz ditolak SEBELUM model dipanggil, jadi tidak ada biaya
 * token yang terbuang untuk pertanyaan yang memang tidak boleh dijawab.
 *
 * Rantai penyedia: DeepSeek → OpenRouter gratis → OpenRouter termurah.
 */

export const runtime = "nodejs";

const KNOWN_NAMES = ustadzData.map((u) => u.name);

export async function GET() {
  return NextResponse.json(getProviderStatus());
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
    message?: string;
    history?: Array<{ role: "user" | "assistant"; content: string }>;
    bookingConfirmed?: boolean;
    verified?: string;
    mode?: string;
    draft?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const message = body.message;
  if (!message || typeof message !== "string") {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  // Upaya manipulasi instruksi ditolak sebelum model dipanggil:
  // deterministik, hemat token, dan hasilnya bisa diaudit.
  const injection = detectPromptInjection(message);
  if (injection.isInjection) {
    return NextResponse.json(
      { error: "injection_blocked", patterns: injection.patterns },
      { status: 422 }
    );
  }

  // Batas domain ditegakkan di server, bukan hanya di klien.
  // "dalil_request" lolos — ditangani Mode Ustadz Hafizh di bawah.
  const scope = checkScope(message);
  const hafizhMode = body.mode === "hafizh" || scope.verdict === "dalil_request";
  if (scope.verdict !== "in_scope" && !hafizhMode) {
    return NextResponse.json(
      { error: "out_of_scope", scope: scope.verdict },
      { status: 422 }
    );
  }

  try {
    /**
     * Hasil pencarian dari mesin lokal dikirim sebagai data terverifikasi.
     * Model hanya menuliskan ulang baris-baris itu — tidak memfilter katalog
     * sendiri, sehingga tidak mungkin memasukkan ustadz dari kota lain.
     */
    const verified = (body.verified ?? "").slice(0, 4000).trim();
    const draft = (body.draft ?? "").slice(0, 3000).trim();
    let systemPrompt: string;
    if (hafizhMode) {
      // Mode Ustadz Hafizh: kutipan terkunci pada dalil terverifikasi.
      systemPrompt = buildHafizhSystemPrompt(verified || undefined);
    } else if (verified) {
      systemPrompt = `${buildRulesPrompt()}

=== DATA HASIL PENCARIAN (SUDAH DISARING OTOMATIS, TERVERIFIKASI) ===
${verified}

ATURAN DATA:
- Jawab HANYA dari baris di atas. Jangan menambah ustadz lain di luar daftar.
- Jangan mengubah angka apa pun (rating, ulasan, biaya, pengalaman, jadwal).
- Jangan mengarang slot jadwal yang tidak tertulis di atas.
- Sebutkan kota/area apa adanya; jangan memindahkan ustadz ke kota lain.`;
    } else {
      systemPrompt = buildGroundedSystemPrompt();
    }

    /**
     * Draf jawaban dari mesin lokal: berisi keputusan struktural yang sudah
     * final — siapa ustadz yang direkomendasikan, urutan pilihan, link
     * undang, dan peringatan waktu salat. Model hanya menuliskan ulang
     * dengan bahasa yang mengalir; substansinya tidak boleh berubah.
     */
    if (draft && !hafizhMode) {
      systemPrompt += `

=== DRAF JAWABAN SISTEM (SUDAH DIVERIFIKASI, FINAL) ===
${draft}

ATURAN DRAF:
- Tulis ulang draf di atas dengan bahasa yang natural dan mengalir — bukan sekadar menyalin.
- JANGAN mengubah: nama ustadz, urutan pilihan, angka (rating, biaya, jam), hari, kota, atau jumlah peserta.
- JANGAN menyebutkan hari, tanggal, jam, kota, atau detail apa pun yang tidak ada di draf, konteks booking, atau riwayat percakapan. Detail yang tidak tertulis = TIDAK ADA; jangan pernah melengkapinya sendiri.
- Pertahankan SEMUA tautan berformat [teks](/path) persis seperti aslinya. Tautan undangan adalah bagian wajib dari jawaban — pengguna harus selalu tahu cara melanjutkan booking.
- Pertahankan semua peringatan (waktu salat, Salat Jumat, ketersediaan) — jangan dihaluskan sampai hilang maknanya.
- Jangan menambah ustadz, angka, atau janji yang tidak ada di draf atau data terverifikasi.
- Bila draf berisi pertanyaan klarifikasi, akhiri dengan pertanyaan itu.`;
    }

    const result = await generateReply({
      systemPrompt,
      history: body.history ?? [],
      userMessage: message,
    });

    if (!result.text) throw new Error("jawaban kosong");

    const unknown = detectUnknownUstadzNames(result.text, KNOWN_NAMES);
    if (unknown.length > 0) {
      return NextResponse.json(
        { error: "hallucinated_names", names: unknown },
        { status: 422 }
      );
    }

    /**
     * Guard anti-halusinasi hari: model yang menulis ulang draf tidak boleh
     * menyebut nama hari yang tidak pernah muncul di draf, pesan pengguna,
     * atau riwayat. Ini yang mencegah jawaban "tersedia Selasa" padahal
     * pengguna minta Rabu. Pelanggaran = 422 → klien jatuh ke mesin lokal.
     */
    if (draft) {
      const DAY_RE = /\b(senin|selasa|rabu|kamis|jumat|sabtu|minggu|ahad)\b/gi;
      const allowedText = [
        draft,
        message,
        (body.history ?? []).map((h) => h.content).join(" "),
      ]
        .join(" ")
        .toLowerCase();
      const allowed = new Set(
        (allowedText.match(DAY_RE) ?? []).map((d) => d.toLowerCase())
      );
      const mentioned = (result.text.match(DAY_RE) ?? []).map((d) =>
        d.toLowerCase()
      );
      const fabricated = mentioned.filter((d) => !allowed.has(d));
      if (fabricated.length > 0) {
        return NextResponse.json(
          { error: "hallucinated_details", details: fabricated },
          { status: 422 }
        );
      }
    }

    return NextResponse.json({
      reply: redactContactBeforeApproval(
        result.text,
        Boolean(body.bookingConfirmed)
      ),
      provider: result.provider,
      model: result.model,
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : "kesalahan tidak dikenal";
    return NextResponse.json({ error: "llm_failed", detail }, { status: 502 });
  }
}

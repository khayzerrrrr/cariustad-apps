import { NextRequest, NextResponse } from "next/server";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import { sanitizeForSpeech } from "@/lib/textSanitize";

/**
 * TTS server-side dengan suara TETAP: "id-ID-ArdiNeural" (laki-laki
 * Indonesia, neural). Tidak bergantung pada suara bawaan browser —
 * hasilnya sama di Chrome, Brave, Firefox, maupun Edge.
 *
 * Sumber: API Edge TTS Microsoft (tanpa kunci API, gratis).
 * Word boundary dikirim ke klien agar animasi bibir tetap tersinkron.
 */

export const runtime = "nodejs";

const VOICE = "id-ID-ArdiNeural";
const MAX_CHARS = 1200;

interface WordTiming {
  charIndex: number;
  atSec: number;
}

/** Pecah teks jadi potongan ≤ 400 karakter di batas kalimat/koma. */
function chunkText(text: string, max = 400): string[] {
  if (text.length <= max) return [text];
  const sentences = text.split(/(?<=[.!?])\s+/);
  const chunks: string[] = [];
  let cur = "";
  for (const s of sentences) {
    if ((cur + " " + s).trim().length <= max) {
      cur = (cur + " " + s).trim();
    } else {
      if (cur) chunks.push(cur);
      cur = s.length > max ? s.slice(0, max) : s;
    }
  }
  if (cur) chunks.push(cur);
  return chunks;
}

/** Estimasi durasi (detik) dari jumlah byte MP3 @48kbps. */
const estSeconds = (bytes: number) => (bytes * 8) / 48_000;

export async function POST(req: NextRequest) {
  let body: { text?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const text = sanitizeForSpeech(body.text ?? "");
  if (!text) {
    return NextResponse.json({ error: "empty_text" }, { status: 400 });
  }
  if (text.length > MAX_CHARS) {
    return NextResponse.json({ error: "text_too_long" }, { status: 413 });
  }

  try {
    const tts = new MsEdgeTTS();
    await tts.setMetadata(VOICE, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3, {
      wordBoundaryEnabled: true,
      sentenceBoundaryEnabled: false,
    });

    const chunks = chunkText(text);
    const audioParts: Buffer[] = [];
    const timings: WordTiming[] = [];
    let globalChar = 0;
    let elapsedSec = 0;

    for (const chunk of chunks) {
      // posisi charIndex global teks untuk potongan ini
      const baseChar = text.indexOf(chunk, globalChar);
      const startChar = baseChar >= 0 ? baseChar : globalChar;
      globalChar = startChar + chunk.length;

      const { audioStream, metadataStream } = tts.toStream(chunk);

      const audioBuf = await new Promise<Buffer>((resolve, reject) => {
        const parts: Buffer[] = [];
        audioStream.on("data", (c: Buffer) => parts.push(c));
        audioStream.on("end", () => resolve(Buffer.concat(parts)));
        audioStream.on("error", reject);
      });

      if (metadataStream) {
        const metaBuf = await new Promise<Buffer>((resolve, reject) => {
          const parts: Buffer[] = [];
          metadataStream.on("data", (c: Buffer) => parts.push(c));
          metadataStream.on("end", () => resolve(Buffer.concat(parts)));
          metadataStream.on("error", () => resolve(Buffer.concat(parts)));
        });
        // metadata: satu JSON per baris — WordBoundary berisi offset (100ns)
        for (const line of metaBuf.toString("utf8").split("\n")) {
          if (!line.trim()) continue;
          try {
            const m = JSON.parse(line);
            if (m?.type !== "WordBoundary") continue;
            const word = String(m.data?.text?.Text ?? "");
            if (!word) continue;
            const localIdx = chunk.indexOf(word);
            timings.push({
              charIndex: startChar + (localIdx >= 0 ? localIdx : 0),
              atSec: elapsedSec + Number(m.data?.offset ?? 0) / 1e7,
            });
          } catch {
            // baris metadata rusak — lewati saja
          }
        }
      }

      audioParts.push(audioBuf);
      elapsedSec += estSeconds(audioBuf.length);
    }

    const audio = Buffer.concat(audioParts).toString("base64");
    timings.sort((a, b) => a.atSec - b.atSec);

    return NextResponse.json(
      { audio, timings, voice: VOICE },
      { headers: { "Cache-Control": "public, max-age=3600" } }
    );
  } catch (err) {
    const detail = err instanceof Error ? err.message : "kesalahan tidak dikenal";
    return NextResponse.json({ error: "tts_failed", detail }, { status: 502 });
  }
}

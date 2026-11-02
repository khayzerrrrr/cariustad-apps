"use client";

/* Web Speech API types for TypeScript */
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export interface VoiceEngineCallbacks {
  onRecognized?: (text: string) => void;
  onPartial?: (text: string) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
  onSpeakStart?: () => void;
  onSpeakEnd?: () => void;
  onSpeakBoundary?: (charIndex: number) => void;
  /** TTS dipanggil tapi tidak menghasilkan suara (mis. Brave memblokir voice). */
  onSpeakError?: (reason: string) => void;
}

/* Nama suara bernuansa laki-laki di berbagai platform.
   Catatan: JANGAN pakai kata "male" saja secara LONGGAR —
   "female" juga mengandung substring "male". */
export const MALE_VOICE_HINTS = [
  "ardi", // Microsoft Ardi (Edge, id-ID male natural)
  "gadang", // Microsoft Gadang (Windows, id-ID male)
  "andika", // Microsoft Andika (Windows, id-ID male)
  "laki-laki",
  "pria",
  " male", // spasi depan supaya tidak menangkap "female"
];
export const FEMALE_VOICE_HINTS = [
  "damayanti", // macOS/iOS id-ID
  "gadis", // Windows id-ID female
  "female",
  "wanita",
  "perempuan",
];

/* Implementasi dipindah ke lib netral agar route server /api/tts bisa memakai. */
export { sanitizeForSpeech } from "@/lib/textSanitize";
import { sanitizeForSpeech } from "@/lib/textSanitize";

/**
 * Pecah teks jadi potongan per kalimat (≤ ~180 karakter) supaya suara mulai
 * keluar sejak kalimat pertama selesai disintesis — bukan menunggu seluruh
 * jawaban (jawaban dalil bisa panjang; tanpa pemecahan, jeda bisa 5-20 detik).
 * Diekspor untuk pengujian.
 */
export function splitForSpeech(text: string): string[] {
  const sentences = text
    .split(/(?<=[.!?…])\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let cur = "";
  for (const s of sentences) {
    const merged = cur ? `${cur} ${s}` : s;
    if (merged.length <= 180) {
      cur = merged;
      continue;
    }
    if (cur) chunks.push(cur);
    if (s.length <= 220) {
      cur = s;
    } else {
      // Kalimat sangat panjang — potong per kata
      cur = "";
      for (const w of s.split(" ")) {
        const attempt = cur ? `${cur} ${w}` : w;
        if (attempt.length > 180 && cur) {
          chunks.push(cur);
          cur = w;
        } else {
          cur = attempt;
        }
      }
    }
  }
  if (cur) chunks.push(cur);
  return chunks;
}

export class VoiceEngine {
  private recognition: any = null;
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private callbacks: VoiceEngineCallbacks = {};
  private listening = false;
  private speaking = false;
  private muted = false;
  /* Daftar suara sering kosong sampai event voiceschanged ditembakkan */
  private voicesCache: SpeechSynthesisVoice[] = [];
  /** Label suara terakhir yang benar-benar dipakai (server atau browser) */
  private currentVoiceLabel: string | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.synth = window.speechSynthesis;
      if (this.synth) {
        this.refreshVoices();
        this.synth.onvoiceschanged = () => this.refreshVoices();
      }
    }
  }

  private refreshVoices() {
    if (!this.synth) return;
    const voices = this.synth.getVoices();
    if (voices.length > 0) this.voicesCache = voices;
  }

  /**
   * Pilih suara laki-laki Indonesia yang ramah.
   *
   * Browser menyediakan kumpulan suara berbeda-beda:
   *  - Edge:  "Microsoft Ardi Online (Natural)" — laki-laki id-ID
   *  - Windows: "Microsoft Gadang" — laki-laki; "Gadis" — perempuan
   *  - macOS/iOS: "Damayanti" — perempuan (satu-satunya id-ID)
   *  - Chrome/Android: suara Google id-ID (umumnya perempuan)
   *
   * Strategi: beri skor positif pada nama bernuansa laki-laki, penalti
   * besar pada nama bernuansa perempuan, lalu jika tidak ada suara
   * laki-laki sama sekali, turunkan pitch agar bernada lebih berat.
   */
  private pickVoice(): { voice: SpeechSynthesisVoice | null; isMale: boolean } {
    this.refreshVoices();
    const idVoices = this.voicesCache.filter((v) =>
      v.lang.toLowerCase().startsWith("id")
    );
    const pool = idVoices.length > 0 ? idVoices : this.voicesCache;

    let best: SpeechSynthesisVoice | null = null;
    let bestScore = -Infinity;
    let bestIsMale = false;

    for (const v of pool) {
      const n = v.name.toLowerCase();
      let score = 0;
      if (v.lang.toLowerCase().startsWith("id")) score += 30;
      if (MALE_VOICE_HINTS.some((h) => n.includes(h))) score += 50;
      if (FEMALE_VOICE_HINTS.some((h) => n.includes(h))) score -= 100;
      if (n.includes("natural") || n.includes("online")) score += 8;
      if (n.includes("google")) score += 4;

      if (score > bestScore) {
        bestScore = score;
        best = v;
        bestIsMale =
          MALE_VOICE_HINTS.some((h) => n.includes(h)) &&
          !FEMALE_VOICE_HINTS.some((h) => n.includes(h));
      }
    }
    return { voice: best, isMale: bestIsMale };
  }

  /** Check if Speech Recognition is supported */
  get isRecognitionSupported(): boolean {
    if (typeof window === "undefined") return false;
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  /** Check if Speech Synthesis is supported */
  get isSynthesisSupported(): boolean {
    if (typeof window === "undefined") return false;
    return !!window.speechSynthesis;
  }

  /** Whether the page runs in a secure context (HTTPS or localhost) */
  get isSecureContext(): boolean {
    if (typeof window === "undefined") return false;
    return window.isSecureContext === true;
  }

  /** Whether the browser exposes a microphone device at all */
  get hasMicrophoneApi(): boolean {
    if (typeof navigator === "undefined") return false;
    return !!navigator.mediaDevices?.getUserMedia;
  }

  /**
   * Read current microphone permission state without triggering a prompt.
   * Returns "granted" | "denied" | "prompt" | "unknown"
   */
  async getPermissionState(): Promise<PermissionState | "unknown"> {
    if (typeof navigator === "undefined" || !navigator.permissions?.query) {
      return "unknown";
    }
    try {
      const status = await navigator.permissions.query({
        name: "microphone" as PermissionName,
      });
      return status.state;
    } catch {
      // Firefox/Safari may not support querying "microphone"
      return "unknown";
    }
  }

  /**
   * Explicitly request microphone access via getUserMedia.
   * This is what actually triggers the browser permission prompt.
   * SpeechRecognition alone often fails silently when permission is not yet granted.
   */
  async requestMicrophoneAccess(): Promise<{ ok: boolean; reason?: string }> {
    if (!this.isSecureContext) {
      return {
        ok: false,
        reason:
          "Halaman harus diakses lewat HTTPS atau localhost. Alamat IP biasa akan diblokir browser.",
      };
    }
    if (!this.hasMicrophoneApi) {
      return {
        ok: false,
        reason:
          "Browser ini tidak menyediakan akses mikrofon (navigator.mediaDevices tidak tersedia).",
      };
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Immediately release the device — we only needed the permission grant
      stream.getTracks().forEach((t) => t.stop());
      return { ok: true };
    } catch (err: any) {
      const name = err?.name || "";
      if (name === "NotAllowedError" || name === "SecurityError") {
        return {
          ok: false,
          reason:
            "Izin mikrofon ditolak. Buka ikon gembok/kamera di address bar → izin Mikrofon → Allow, lalu muat ulang halaman.",
        };
      }
      if (name === "NotFoundError" || name === "DevicesNotFoundError") {
        return {
          ok: false,
          reason:
            "Tidak ada mikrofon terdeteksi. Pastikan mikrofon terpasang dan tidak dinonaktifkan di sistem.",
        };
      }
      if (name === "NotReadableError") {
        return {
          ok: false,
          reason:
            "Mikrofon sedang dipakai aplikasi lain. Tutup aplikasi tersebut lalu coba lagi.",
        };
      }
      return { ok: false, reason: `Gagal mengakses mikrofon: ${name || "unknown"}` };
    }
  }

  get isListening(): boolean {
    return this.listening;
  }

  get isSpeaking(): boolean {
    return this.speaking;
  }

  get isMuted(): boolean {
    return this.muted;
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (muted && this.synth) {
      this.synth.cancel();
      this.speaking = false;
    }
  }

  /** Start speech recognition (voice input) */
  startListening(callbacks: VoiceEngineCallbacks) {
    if (!this.isRecognitionSupported) {
      callbacks.onError?.("Browser tidak mendukung pengenalan suara");
      return;
    }

    this.stopListening();
    this.callbacks = callbacks;

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SR();
    this.recognition.lang = "id-ID";
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.maxAlternatives = 1;

    this.recognition.onresult = (event: any) => {
      let interim = "";
      let final = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }

      if (interim) {
        this.callbacks.onPartial?.(interim);
      }
      if (final) {
        this.callbacks.onRecognized?.(final.trim());
      }
    };

    this.recognition.onerror = (event: any) => {
      this.listening = false;
      let errMsg = "Terjadi kesalahan pada pengenalan suara";
      switch (event.error) {
        case "not-allowed":
        case "service-not-allowed":
          errMsg =
            "Izin mikrofon ditolak. Klik ikon gembok di address bar → izin Mikrofon → Allow, lalu muat ulang halaman.";
          break;
        case "audio-capture":
          errMsg =
            "Mikrofon tidak terdeteksi atau sedang dipakai aplikasi lain. Periksa perangkat Anda.";
          break;
        case "no-speech":
          errMsg = "Tidak ada suara terdeteksi. Coba bicara lebih dekat ke mikrofon.";
          break;
        case "network":
          errMsg =
            "Kesalahan jaringan pada pengenalan suara. Periksa koneksi internet Anda.";
          break;
        case "aborted":
          errMsg = "Pengenalan suara dibatalkan.";
          break;
        default:
          errMsg = `Kesalahan mikrofon (${event.error || "unknown"}). Coba lagi.`;
      }
      this.callbacks.onError?.(errMsg);
    };

    this.recognition.onend = () => {
      this.listening = false;
      this.callbacks.onEnd?.();
    };

    try {
      this.recognition.start();
      this.listening = true;
    } catch (e) {
      this.callbacks.onError?.("Gagal memulai pengenalan suara");
    }
  }

  /** Stop speech recognition */
  stopListening() {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {
        // ignore
      }
      this.recognition = null;
    }
    this.listening = false;
  }

  /**
   * Speak text using TTS.
   * Prioritas: TTS SERVER (/api/tts — suara neural tetap "Ardi", sama di
   * semua browser). Bila server gagal/belum siap → jatuh ke suara bawaan
   * browser (kualitas tergantung perangkat).
   */
  speak(text: string, callbacks?: VoiceEngineCallbacks) {
    if (this.muted) {
      callbacks?.onSpeakEnd?.();
      return;
    }
    if (callbacks) {
      this.callbacks = { ...this.callbacks, ...callbacks };
    }

    this.speakServer(text).catch((e: unknown) => {
      /* Laporkan alasan agar Tes Suara tidak gelap — lalu fallback. */
      const reason = e instanceof Error ? e.message : String(e);
      this.currentVoiceLabel = `TTS tetap gagal (${reason}) — memakai suara browser`;
      this.speakBrowser(text);
    });
  }

  private serverAudio: HTMLAudioElement | null = null;
  private boundaryRaf: number | null = null;
  private serverFinished = false;
  /** Di-set true oleh stopServerAudio() agar rantai potongan berhenti. */
  private serverCancelled = false;

  private stopServerAudio() {
    this.serverCancelled = true;
    if (this.boundaryRaf !== null) {
      cancelAnimationFrame(this.boundaryRaf);
      this.boundaryRaf = null;
    }
    if (this.serverAudio) {
      try {
        this.serverAudio.pause();
        this.serverAudio.src = "";
      } catch {
        // ignore
      }
      this.serverAudio = null;
    }
  }

  /**
   * TTS dari server — suara tetap id-ID-ArdiNeural, tak tergantung browser.
   *
   * ANTI-JEDA: teks dipecah per kalimat. Kalimat pertama diputar segera
   * setelah audionya siap; kalimat berikutnya disintesis PARALEL selagi
   * kalimat sebelumnya sedang dibacakan. Sebelumnya seluruh jawaban harus
   * selesai disintesis dulu — untuk jawaban panjang jeda bisa 5-20 detik.
   */
  private async speakServer(text: string): Promise<void> {
    const { MsEdgeTTS, OUTPUT_FORMAT } = await import("msedge-tts");
    if (!MsEdgeTTS) throw new Error("modul tts gagal dimuat");

    const spoken = sanitizeForSpeech(text);
    const chunks = splitForSpeech(spoken);
    if (chunks.length === 0) throw new Error("teks kosong");

    // Offset karakter global tiap potongan — untuk lip-sync melintasi potongan
    const offsets: number[] = [];
    let acc = 0;
    for (const c of chunks) {
      offsets.push(acc);
      acc += c.length + 1;
    }

    const withTimeout = <T>(p: Promise<T>, ms: number, label: string) =>
      Promise.race([
        p,
        new Promise<never>((_, rej) =>
          setTimeout(() => rej(new Error(label)), ms)
        ),
      ]);

    /** Sintesis satu potongan → URL audio + peta timing kata (charIndex global). */
    const synthChunk = async (
      chunkText: string,
      offset: number
    ): Promise<{ url: string; timings: Array<{ charIndex: number; atSec: number }> }> => {
      const tts = new MsEdgeTTS();
      // Handshake dibatasi 6 dtk — kalau layanan lambat, fallback cepat ke
      // suara browser daripada menggantung (penyebab jeda terlama sebelumnya).
      await withTimeout(
        tts.setMetadata(
          "id-ID-ArdiNeural",
          OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3,
          { wordBoundaryEnabled: true, sentenceBoundaryEnabled: false }
        ),
        6000,
        "koneksi layanan suara lambat"
      );

      const { audioStream, metadataStream } = tts.toStream(chunkText);

      const audioParts: BlobPart[] = [];
      const timings: Array<{ charIndex: number; atSec: number }> = [];

      const metaDone = new Promise<void>((resolve) => {
        if (!metadataStream) return resolve();
        const metaLines: string[] = [];
        metadataStream.on("data", (c: any) => metaLines.push(String(c)));
        metadataStream.on("end", () => {
          for (const line of metaLines.join("").split("\n")) {
            if (!line.trim()) continue;
            try {
              const m = JSON.parse(line);
              if (m?.type !== "WordBoundary") continue;
              const word = String(m.data?.text?.Text ?? "");
              if (!word) continue;
              const idx = chunkText.indexOf(word);
              timings.push({
                charIndex: offset + (idx >= 0 ? idx : 0),
                atSec: Number(m.data?.offset ?? 0) / 1e7,
              });
            } catch {
              /* baris rusak — lewati */
            }
          }
          timings.sort((a, b) => a.atSec - b.atSec);
          resolve();
        });
        metadataStream.on("error", () => resolve());
      });

      await withTimeout(
        new Promise<void>((resolve, reject) => {
          audioStream.on("data", (c: any) => audioParts.push(c));
          audioStream.on("end", () => resolve());
          audioStream.on("error", (e: any) => reject(new Error(String(e))));
        }),
        15000,
        "sintesis timeout"
      ).catch((e) => {
        try {
          audioStream.destroy?.();
        } catch {
          /* noop */
        }
        throw e;
      });

      await metaDone;

      if (audioParts.length === 0) throw new Error("audio kosong");
      const blob = new Blob(audioParts, { type: "audio/mpeg" });
      return { url: URL.createObjectURL(blob), timings };
    };

    this.synth?.cancel();
    this.stopServerAudio();
    this.serverCancelled = false;
    this.serverFinished = false;
    this.currentVoiceLabel = "id-ID-ArdiNeural (suara tetap)";

    let anyPlayed = false;

    const finish = (err?: string) => {
      if (this.serverFinished) return;
      this.serverFinished = true;
      if (this.boundaryRaf !== null) {
        cancelAnimationFrame(this.boundaryRaf);
        this.boundaryRaf = null;
      }
      this.speaking = false;
      /* Error hanya dilaporkan bila TIDAK ADA suara yang keluar sama sekali —
         kegagalan di tengah-tengah (potongan ke-3 misalnya) cukup diakhiri
         normal, jangan menampilkan banner "rusak" yang menyesatkan. */
      if (err && !anyPlayed) this.callbacks.onSpeakError?.(err);
      this.callbacks.onSpeakEnd?.();
    };

    /** Putar satu potongan; resolve dengan statusnya. */
    const playChunk = (
      url: string,
      timings: Array<{ charIndex: number; atSec: number }>
    ): Promise<"played" | "blocked" | "error"> =>
      new Promise((resolve) => {
        if (this.boundaryRaf !== null) {
          cancelAnimationFrame(this.boundaryRaf);
          this.boundaryRaf = null;
        }
        const audio = new Audio(url);
        this.serverAudio = audio;

        const loop = () => {
          if (!this.serverAudio || this.serverAudio.paused) return;
          let last = -1;
          for (let i = 0; i < timings.length; i++) {
            if (timings[i].atSec <= this.serverAudio.currentTime) last = i;
            else break;
          }
          if (last >= 0) this.callbacks.onSpeakBoundary?.(timings[last].charIndex);
          this.boundaryRaf = requestAnimationFrame(loop);
        };

        audio.onplay = () => {
          this.speaking = true;
          this.callbacks.onSpeakStart?.();
          this.boundaryRaf = requestAnimationFrame(loop);
        };
        audio.onended = () => resolve("played");
        audio.onerror = () => resolve("error");
        audio.play().catch((err: any) => {
          if (err?.name === "NotAllowedError") {
            /* Autoplay diblokir (biasanya sapaan saat load halaman tanpa klik).
               BUKAN kerusakan TTS — berhenti diam; begitu pengguna berinteraksi,
               audio jalan normal. */
            resolve("blocked");
            return;
          }
          resolve("error");
        });
      });

    try {
      type ChunkResult = {
        url: string;
        timings: Array<{ charIndex: number; atSec: number }>;
      } | null;
      let next: Promise<ChunkResult> | null = null;
      let nextErr: unknown = null;

      for (let i = 0; i < chunks.length; i++) {
        if (this.serverCancelled || this.serverFinished) break;

        let res: ChunkResult;
        if (i === 0) {
          res = await synthChunk(chunks[0], offsets[0]);
        } else {
          res = next ? await next : await synthChunk(chunks[i], offsets[i]);
          if (!res) {
            /* Potongan hasil pra-sintesis gagal. Bila sudah ada suara yang
               keluar → akhiri anggun (JANGAN fallback ke suara browser,
               itu akan mengulang seluruh teks dari awal). */
            if (anyPlayed) break;
            throw nextErr ?? new Error("pra-sintesis gagal");
          }
        }

        // Pra-sintesis potongan berikutnya SELAGI potongan ini diputar
        if (i + 1 < chunks.length) {
          nextErr = null;
          const idx = i + 1;
          next = synthChunk(chunks[idx], offsets[idx]).catch((e) => {
            nextErr = e;
            return null;
          });
        }

        const status = await playChunk(res.url, res.timings);
        if (status === "blocked") {
          this.stopServerAudio();
          this.serverFinished = true;
          this.speaking = false;
          return;
        }
        if (status === "played") {
          anyPlayed = true;
          this.speaking = false;
        } else {
          if (!anyPlayed) throw new Error("server_audio_error");
          break; // sudah ada suara yang keluar — akhiri dengan anggun
        }
      }
    } finally {
      // Rantai selesai; finish() dipanggil di bawah untuk membereskan state
    }

    finish();
  }

  /** TTS bawaan browser — jalur cadangan bila server tidak tersedia. */
  private speakBrowser(text: string) {
    if (!this.synth || !this.isSynthesisSupported) {
      this.callbacks.onSpeakError?.("no_tts_available");
      this.callbacks.onSpeakEnd?.();
      return;
    }

    // Cancel any ongoing speech
    this.synth.cancel();
    this.stopServerAudio();

    const spoken = sanitizeForSpeech(text);
    const utterance = new SpeechSynthesisUtterance(spoken);
    utterance.lang = "id-ID";

    const { voice, isMale } = this.pickVoice();
    if (voice) {
      utterance.voice = voice;
    }
    // Suara laki-laki asli: nada sedikit dalam & tempo tenang agar terdengar
    // bijak. Jika hanya tersedia suara perempuan, turunkan pitch agar
    // bernada lebih netral/maskulin.
    utterance.pitch = isMale ? 0.92 : 0.78;
    utterance.rate = isMale ? 0.98 : 0.96;
    utterance.volume = 1.0;
    this.currentVoiceLabel = voice ? voice.name : "Suara default browser";

    /* Penjaga agar onSpeakEnd/onSpeakError hanya terpanggil sekali per ujaran */
    let finished = false;
    const finish = (err?: string) => {
      if (finished) return;
      finished = true;
      window.clearTimeout(watchdog);
      this.speaking = false;
      this.currentUtterance = null;
      if (err) {
        this.callbacks.onSpeakError?.(err);
      }
      this.callbacks.onSpeakEnd?.();
    };

    /* Watchdog "bisu": sebagian browser (terutama Brave dengan Shields)
       membiarkan speechSynthesis.speak() tanpa suara dan TANPA event apa
       pun — onend tidak pernah datang sehingga avatar nyangkut di state
       "berbicara". Jika dalam 1,5 detik tidak ada tanda pembicaraan,
       nyatakan gagal secara eksplisit. */
    const watchdog = window.setTimeout(() => {
      const engineBusy = this.synth ? this.synth.speaking || this.synth.pending : false;
      if (!this.speaking && !engineBusy) {
        finish("silent");
      }
    }, 1500);

    utterance.onstart = () => {
      this.speaking = true;
      this.callbacks.onSpeakStart?.();
    };

    utterance.onend = () => finish();

    utterance.onerror = (event) => {
      const err = (event as SpeechSynthesisErrorEvent)?.error || "error";
      /* 'interrupted' & 'canceled' biasanya terjadi karena KITA sendiri
         memanggil cancel() (ganti bicara / mute) — bukan kerusakan TTS.
         Melaporkannya sebagai error membuat banner "pakai Edge" muncul
         padahal browser sehat. */
      if (err === "interrupted" || err === "canceled") {
        finish();
        return;
      }
      finish(`tts:${err}`);
    };

    utterance.onboundary = (event) => {
      this.callbacks.onSpeakBoundary?.(event.charIndex);
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  }

  /** Stop speaking */
  stopSpeaking() {
    if (this.synth) {
      this.synth.cancel();
    }
    this.stopServerAudio();
    this.speaking = false;
    this.currentUtterance = null;
  }

  /** Get available voices */
  getVoices(): SpeechSynthesisVoice[] {
    if (!this.synth) return [];
    this.refreshVoices();
    return this.voicesCache;
  }

  /** Suara yang akan dipilih untuk bicara — berguna untuk uji & diagnostik */
  getVoiceInfo(): { name: string | null; lang: string | null; isMale: boolean } {
    const { voice, isMale } = this.pickVoice();
    return { name: voice?.name ?? null, lang: voice?.lang ?? null, isMale };
  }

  /** Status lengkap TTS untuk tombol "Tes Suara" & pesan diagnostik */
  getTTSStatus(): {
    supported: boolean;
    voicesCount: number;
    voiceName: string | null;
    isMale: boolean;
  } {
    this.refreshVoices();
    return {
      supported: true, // jalur server selalu tersedia bila deployment hidup
      voicesCount: this.voicesCache.length,
      voiceName: this.currentVoiceLabel ?? this.getVoiceInfo().name,
      isMale: true, // suara server (Ardi) laki-laki
    };
  }

  /** Cleanup */
  destroy() {
    this.stopListening();
    this.stopSpeaking();
  }
}

/** Singleton instance */
let _instance: VoiceEngine | null = null;

export function getVoiceEngine(): VoiceEngine {
  if (!_instance) {
    _instance = new VoiceEngine();
  }
  return _instance;
}

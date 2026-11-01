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
}

export class VoiceEngine {
  private recognition: any = null;
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private callbacks: VoiceEngineCallbacks = {};
  private listening = false;
  private speaking = false;
  private muted = false;

  constructor() {
    if (typeof window !== "undefined") {
      this.synth = window.speechSynthesis;
    }
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

  /** Speak text using TTS */
  speak(text: string, callbacks?: VoiceEngineCallbacks) {
    if (this.muted || !this.synth || !this.isSynthesisSupported) {
      callbacks?.onSpeakEnd?.();
      return;
    }

    // Cancel any ongoing speech
    this.synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "id-ID";
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Try to find Indonesian male voice
    const voices = this.synth.getVoices();
    const idVoice = voices.find(
      (v) => v.lang.startsWith("id") && v.name.toLowerCase().includes("male")
    ) || voices.find((v) => v.lang.startsWith("id"));

    if (idVoice) {
      utterance.voice = idVoice;
    }

    if (callbacks) {
      this.callbacks = { ...this.callbacks, ...callbacks };
    }

    utterance.onstart = () => {
      this.speaking = true;
      this.callbacks.onSpeakStart?.();
    };

    utterance.onend = () => {
      this.speaking = false;
      this.callbacks.onSpeakEnd?.();
    };

    utterance.onerror = () => {
      this.speaking = false;
      this.callbacks.onSpeakEnd?.();
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
    this.speaking = false;
    this.currentUtterance = null;
  }

  /** Get available voices */
  getVoices(): SpeechSynthesisVoice[] {
    if (!this.synth) return [];
    return this.synth.getVoices();
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

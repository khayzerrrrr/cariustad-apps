"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Send, Shield, ScrollText, AlertTriangle, Sparkles, BookOpen } from "lucide-react";
import { avatarReducer, AvatarState, AvatarAction } from "@/lib/avatar/stateMachine";
import { getVoiceEngine } from "@/lib/avatar/voiceEngine";
import { logAudit, getAuditLog, AuditEntry } from "@/lib/ai/auditLog";
import { answer, getServerLLMStatus } from "@/lib/ai/answerEngine";
import { AgentContext, EMPTY_CONTEXT } from "@/lib/ai/agentContext";
import { isLLMConfigured } from "@/lib/ai/llmProvider";
import { addBooking, getBookings } from "@/lib/storage";
import { checkBooking } from "@/lib/bookingGuard";
import TranscriptPanel, { ChatMessage } from "./TranscriptPanel";
import VoiceControls from "./VoiceControls";
import Avatar2D from "@/components/avatar/Avatar2D";
import AvatarPhoto from "@/components/avatar/AvatarPhoto";
import { Camera, Palette, VolumeX } from "lucide-react";

const STATE_LABELS: Record<AvatarState, string> = {
  idle: "Siap membantu",
  listening: "Mendengarkan...",
  thinking: "Berfikir...",
  speaking: "Berbicara...",
  greeting: "Menyapa",
  error: "Terjadi kesalahan",
};

const STATE_COLORS: Record<AvatarState, string> = {
  idle: "bg-slate-400",
  listening: "bg-red-500",
  thinking: "bg-amber-500",
  speaking: "bg-emerald-500",
  greeting: "bg-gold-500",
  error: "bg-red-600",
};

export default function AsistenClient() {
  const [avatarState, dispatchAvatar] = useState<AvatarState>("idle");
  /** "photo" = wajah asli bergerak, "cartoon" = karakter SVG */
  const [avatarMode, setAvatarMode] = useState<"photo" | "cartoon">("photo");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [partialText, setPartialText] = useState("");
  const [micError, setMicError] = useState<string | null>(null);
  const [speakingText, setSpeakingText] = useState("");
  const [speakChar, setSpeakChar] = useState(-1);
  /** TTS tidak menghasilkan suara di browser ini (mis. Brave memblokir voice) */
  const [ttsBroken, setTtsBroken] = useState(false);
  const [ttsTest, setTtsTest] = useState<"idle" | "testing" | "ok" | "fail">("idle");
  const [ttsDetail, setTtsDetail] = useState<string | null>(null);
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [injectionCount, setInjectionCount] = useState(0);
  const [provider, setProvider] = useState<"workbuddy" | "deepseek" | "openrouter" | "local">("local");
  const [llmReady, setLlmReady] = useState(false);
  const [llmLabel, setLlmLabel] = useState("Mesin lokal");
  const [llmBackup, setLlmBackup] = useState<string | null>(null);

  const voiceEngineRef = useRef(getVoiceEngine());
  const inputRef = useRef<HTMLInputElement>(null);
  const agentContextRef = useRef<AgentContext>(EMPTY_CONTEXT);

  // Initialize voice engine
  useEffect(() => {
    const ve = voiceEngineRef.current;
    const supported = ve.isSecureContext && ve.isRecognitionSupported;
    setVoiceSupported(supported);
    setLlmReady(isLLMConfigured());

    // Deteksi penyedia LLM di server. Kunci tidak pernah dikirim ke browser.
    getServerLLMStatus().then((status) => {
      if (status.configured) {
        setLlmReady(true);
        setLlmLabel(status.label);
        setLlmBackup(status.backup);
      }
    });

    if (!ve.isSecureContext) {
      setMicError(
        "Halaman ini tidak berjalan di konteks aman (HTTPS/localhost). Browser memblokir akses mikrofon di HTTP atau alamat IP biasa. Buka lewat https:// atau http://localhost, lalu coba lagi."
      );
    }

    // Proactively surface a known-denied permission so the user isn't left guessing
    ve.getPermissionState().then((state) => {
      if (state === "denied") {
        setMicError(
          "Izin mikrofon sebelumnya ditolak untuk situs ini. Aktifkan lewat ikon gembok di address bar, lalu muat ulang halaman."
        );
      }
    });

    // Trigger greeting on mount
    const greetingTimer = setTimeout(() => {
      dispatch("GREET");
      const greetingMsg: ChatMessage = {
        id: `greeting-${Date.now()}`,
        role: "assistant",
        content:
          "Assalamu'alaikum warahmatullah. Saya Asisten AI CariUstadz, siap membantu Anda menemukan dan booking ustadz terverifikasi. Saya juga punya Mode Ustadz Hafizh — silakan tanya dalil Al-Quran atau hadis. Ceritakan kebutuhan Anda dengan mengetik atau berbicara.",
        timestamp: Date.now(),
      };
      setMessages([greetingMsg]);

      // Speak greeting if voice supported
      if (!isMuted && ve.isSynthesisSupported) {
        setSpeakingText(greetingMsg.content);
        setSpeakChar(0);
        ve.speak(greetingMsg.content, {
          onSpeakStart: () => dispatch("START_SPEAKING"),
          onSpeakBoundary: (i) => setSpeakChar(i),
          onSpeakEnd: () => {
            dispatch("STOP_SPEAKING");
            setSpeakChar(-1);
          },
          /* Gagal sapaan (mis. autoplay diblokir) TIDAK menandai TTS rusak —
             jangan bisukan balasan chat hanya karena pembuka tak terdengar. */
          onSpeakError: () => {
            dispatch("STOP_SPEAKING");
            setSpeakChar(-1);
          },
        });
      }

      // Reset to idle after greeting animation
      setTimeout(() => dispatch("RESET"), 2000);
    }, 800);

    return () => {
      clearTimeout(greetingTimer);
      ve.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dispatch = useCallback((action: AvatarAction) => {
    dispatchAvatar((prev) => avatarReducer(prev, action));
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      // Log input to audit
      logAudit("parse", "user_input", text, "Processing user message", "success");

      // Add user message
      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: text,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setPartialText("");
      setIsThinking(true);
      dispatch("USER_INPUT");

      try {
        const result = await answer(
          text,
          agentContextRef.current,
          messages.map((m) => ({ role: m.role, content: m.content }))
        );

        // Simpan konteks terbaru untuk giliran berikutnya
        agentContextRef.current = result.context;
        setProvider(result.provider);

        // Booking yang dikonfirmasi pengguna benar-benar dicatat —
        // tapi tetap melewati guard anti-abuse (slot ganda, spam, cooldown).
        let bookingBlocked: string | null = null;
        if (result.booking) {
          const guard = checkBooking(getBookings(), {
            ustadzId: result.booking.ustadzId,
            day: result.booking.day,
            time: result.booking.time,
          });
          if (guard.allowed) {
            addBooking({
              id: `bk-${Date.now()}`,
              ustadzId: result.booking.ustadzId,
              ustadzName: result.booking.ustadzName,
              day: result.booking.day,
              time: result.booking.time,
              eventName: result.booking.eventName,
              location: result.booking.location,
              audience: result.booking.audience,
              notes: result.booking.notes,
              status: "pending",
              createdAt: new Date().toISOString(),
            });
          } else {
            bookingBlocked = guard.reason ?? "Booking ditolak sistem.";
          }
        }

        // Audit
        if (result.action === "blocked") {
          setInjectionCount((c) => c + 1);
          logAudit("injection_blocked", "prompt_injection_detected", text, result.reply, "blocked", {
            action: result.action,
          });
        } else if (result.action === "refused") {
          logAudit("error", "out_of_scope_refused", text, result.reply, "blocked", {
            scope: result.scope,
          });
        } else if (result.booking) {
          logAudit(
            bookingBlocked ? "error" : "execute",
            bookingBlocked ? "booking_guard_rejected" : "booking_confirmed",
            text,
            bookingBlocked ?? result.reply,
            bookingBlocked ? "blocked" : "success",
            { provider: result.provider }
          );
        } else {
          logAudit(
            result.action === "booking_plan" ? "plan" : "search",
            "agent_response",
            text,
            result.reply,
            "success",
            { action: result.action, provider: result.provider }
          );
        }

        if (result.fallbackReason) {
          console.warn("[asisten] LLM fallback:", result.fallbackReason);
        }

        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          role: "assistant",
          content: bookingBlocked
            ? `⚠️ **Booking tidak diproses**\n\n${bookingBlocked}\n\nSilakan sesuaikan permintaan Anda, atau buka halaman [Booking](/booking) untuk mengelola booking yang ada.`
            : result.reply,
          timestamp: Date.now(),
          action: result.action,
          injectionDetected: result.action === "blocked",
        };
        setMessages((prev) => [...prev, aiMsg]);
        setIsThinking(false);

        // Speak response
        const ve = voiceEngineRef.current;
        if (!isMuted && !ttsBroken && ve.isSynthesisSupported) {
          setSpeakingText(result.reply);
          setSpeakChar(0);
          dispatch("START_SPEAKING");
          ve.speak(result.reply, {
            onSpeakStart: () => dispatch("START_SPEAKING"),
            onSpeakBoundary: (i) => setSpeakChar(i),
            onSpeakEnd: () => {
              dispatch("STOP_SPEAKING");
              setSpeakChar(-1);
            },
            onSpeakError: () => {
              dispatch("STOP_SPEAKING");
              setSpeakChar(-1);
              setTtsBroken(true);
            },
          });
        } else {
          dispatch("STOP_SPEAKING");
        }
      } catch (err) {
        console.error("Chat error:", err);
        setIsThinking(false);
        dispatch("ERROR");

        const errMsg: ChatMessage = {
          id: `err-${Date.now()}`,
          role: "assistant",
          content:
            "Maaf, terjadi kesalahan. Silakan coba lagi atau gunakan teks untuk bertanya.",
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, errMsg]);
        logAudit("error", "api_error", text, "Fetch failed", "failure");

        setTimeout(() => dispatch("RESET"), 2000);
      }
    },
    [messages, isMuted, ttsBroken, dispatch]
  );

  const handleToggleListen = useCallback(async () => {
    const ve = voiceEngineRef.current;

    if (isListening) {
      ve.stopListening();
      setIsListening(false);
      dispatch("STOP_LISTENING");
      return;
    }

    // Stop speaking if currently speaking
    if (ve.isSpeaking) {
      ve.stopSpeaking();
      dispatch("STOP_SPEAKING");
    }

    // Explicitly request microphone permission FIRST.
    // SpeechRecognition often fails silently if permission was never granted.
    const permission = await ve.requestMicrophoneAccess();
    if (!permission.ok) {
      setMicError(permission.reason || "Izin mikrofon diperlukan untuk input suara.");
      dispatch("ERROR");
      setTimeout(() => dispatch("RESET"), 2000);
      return;
    }

    setMicError(null);
    dispatch("START_LISTENING");
    setIsListening(true);

    ve.startListening({
      onPartial: (text) => {
        setPartialText(text);
      },
      onRecognized: (text) => {
        setPartialText("");
        setIsListening(false);
        sendMessage(text);
      },
      onError: (error) => {
        setIsListening(false);
        dispatch("ERROR");
        setMicError(error);
        setTimeout(() => dispatch("RESET"), 2000);
      },
      onEnd: () => {
        setIsListening(false);
        if (avatarState === "listening") {
          dispatch("STOP_LISTENING");
        }
      },
    });
  }, [isListening, avatarState, dispatch, sendMessage]);

  const handleToggleMute = useCallback(() => {
    const ve = voiceEngineRef.current;
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    ve.setMuted(newMuted);
    if (newMuted) {
      dispatch("STOP_SPEAKING");
    }
  }, [isMuted, dispatch]);

  /** Uji suara manual: bacakan kalimat pendek & laporkan hasilnya */
  const handleTestVoice = useCallback(() => {
    const ve = voiceEngineRef.current;
    const status = ve.getTTSStatus();
    setTtsTest("testing");
    setTtsDetail(null);
    ve.speak("Assalamualaikum, ini tes suara asisten Cari Ustadz.", {
      onSpeakEnd: () => {
        setTtsTest("ok");
        setTtsDetail(
          status.voiceName
            ? `Suara aktif: ${status.voiceName}`
            : `Suara default browser (${status.voicesCount} suara tersedia)`
        );
      },
      onSpeakError: (reason) => {
        setTtsTest("fail");
        setTtsDetail(
          status.voicesCount === 0
            ? "Browser ini tidak punya SATU PUN suara TTS terpasang. Di Chrome Linux hal ini umum (butuh Speech Dispatcher). Solusi paling mudah: buka situs ini di Microsoft Edge — suara laki-laki Indonesia langsung tersedia."
            : reason === "silent"
              ? `Suara tidak diputar meski ${status.voicesCount} voice terdaftar (${status.voiceName ?? "?"}). Coba: (1) pastikan volume tidak bisu, (2) buka tab lain lalu kembali, (3) gunakan Microsoft Edge.`
              : `TTS error: ${reason}`
        );
      },
    });
  }, []);

  const handleReset = useCallback(() => {
    setMessages([]);
    setInput("");
    setPartialText("");
    setIsThinking(false);
    setIsListening(false);
    setSpeakingText("");
    setSpeakChar(-1);
    agentContextRef.current = EMPTY_CONTEXT;
    dispatch("RESET");
    voiceEngineRef.current.stopSpeaking();
    voiceEngineRef.current.stopListening();
  }, [dispatch]);

  const handleShowAudit = useCallback(() => {
    setAuditEntries(getAuditLog());
    setShowAuditLog(!showAuditLog);
  }, [showAuditLog]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-emerald-900">
              Asisten AI CariUstadz
            </h1>
            <p className="text-sm text-gray-500">
              AI Agent dengan kesadaran budaya Islam & akuntabilitas penuh
            </p>
          </div>

          {/* Accountability badges */}
          <div className="hidden sm:flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
                llmReady
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-slate-100 text-slate-600"
              }`}
              title={
                llmReady
                  ? `Jawaban dihasilkan ${llmLabel}${llmBackup ? ` — ${llmBackup}` : ""}`
                  : "LLM belum aktif — memakai mesin aturan lokal"
              }
            >
              <Sparkles className="w-3 h-3" />
              {llmReady ? llmLabel : "Mesin lokal"}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
              <Shield className="w-3 h-3" />
              Human-in-the-Loop
            </span>
            <button
              onClick={handleShowAudit}
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                showAuditLog
                  ? "bg-amber-100 text-amber-700"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <ScrollText className="w-3 h-3" />
              Audit Log ({auditEntries.length || getAuditLog().length})
            </button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
          {/* Left: 3D Avatar + Voice Controls */}
          <div className="flex flex-col rounded-2xl border border-emerald-100 bg-white shadow-sm overflow-hidden">
            {/* Avatar canvas */}
            <div className="relative h-[340px] sm:h-[420px] bg-gradient-to-b from-emerald-50/50 to-transparent">
              {avatarMode === "photo" ? (
                <AvatarPhoto
                  state={avatarState}
                  speakingText={speakingText}
                  charIndex={speakChar}
                />
              ) : (
                <Avatar2D
                  state={avatarState}
                  speakingText={speakingText}
                  charIndex={speakChar}
                />
              )}

              {/* Toggle mode avatar */}
              <button
                onClick={() =>
                  setAvatarMode((m) => (m === "photo" ? "cartoon" : "photo"))
                }
                className="absolute top-4 right-4 z-10 inline-flex items-center gap-1.5 rounded-full bg-white/90 backdrop-blur px-3 py-1.5 shadow-sm text-xs font-medium text-gray-700 hover:bg-white transition-colors"
                title="Ganti mode avatar"
              >
                {avatarMode === "photo" ? (
                  <>
                    <Palette className="h-3.5 w-3.5" />
                    Avatar Kartun
                  </>
                ) : (
                  <>
                    <Camera className="h-3.5 w-3.5" />
                    Avatar Foto
                  </>
                )}
              </button>

              {/* Peringatan TTS tidak berfungsi (mis. Brave memblokir suara) */}
              {ttsBroken && !isMuted && (
                <div className="absolute bottom-16 left-4 right-4 z-10 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/95 backdrop-blur px-3 py-2 shadow-md">
                  <VolumeX className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  <p className="text-xs leading-relaxed text-amber-800">
                    Suara tidak dapat diputar di browser ini (teks tetap tampil di
                    chat). Paling sering: Chrome/Brave di Linux tanpa Speech
                    Dispatcher. Solusi: buka di <strong>Microsoft Edge</strong>{" "}
                    (suara laki-laki Indonesia &quot;Ardi&quot; langsung tersedia) atau
                    Chrome di Windows/Mac. Klik <strong>Tes Suara</strong> di bawah
                    avatar untuk diagnosis.
                  </p>
                  <button
                    onClick={() => setTtsBroken(false)}
                    className="ml-auto shrink-0 text-amber-500 hover:text-amber-700"
                    aria-label="Tutup peringatan"
                  >
                    ×
                  </button>
                </div>
              )}

              {/* State indicator */}
              <div className="absolute top-4 left-4 flex items-center gap-2 rounded-full bg-white/90 backdrop-blur px-3 py-1.5 shadow-sm">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${STATE_COLORS[avatarState]} ${
                    avatarState === "listening" || avatarState === "speaking" ? "animate-pulse" : ""
                  }`}
                />
                <span className="text-xs font-medium text-gray-700">
                  {STATE_LABELS[avatarState]}
                </span>
              </div>

              {/* Partial transcript during listening */}
              {partialText && (
                <div className="absolute bottom-4 left-4 right-4 rounded-xl bg-white/90 backdrop-blur px-4 py-2 shadow-md">
                  <p className="text-sm text-gray-700 italic">
                    &ldquo;{partialText}...&rdquo;
                  </p>
                </div>
              )}
            </div>

            {/* Voice controls */}
            <div className="border-t border-emerald-50 px-4 py-3">
              <VoiceControls
                isListening={isListening}
                isSpeaking={avatarState === "speaking"}
                isMuted={isMuted}
                voiceSupported={voiceSupported}
                onToggleListen={handleToggleListen}
                onToggleMute={handleToggleMute}
                onReset={handleReset}
              />

              {/* Diagnostik suara */}
              <div className="border-t border-emerald-50 px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleTestVoice}
                    disabled={ttsTest === "testing"}
                    className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-60 transition-colors"
                  >
                    {ttsTest === "testing" ? "Menguji…" : "🔊 Tes Suara"}
                  </button>
                  {ttsTest === "ok" && (
                    <span className="text-xs text-emerald-600">✓ {ttsDetail}</span>
                  )}
                  {ttsTest === "fail" && (
                    <span className="text-xs text-amber-700">✗ {ttsDetail}</span>
                  )}
                  {!ttsDetail && ttsTest === "idle" && (
                    <span className="text-[11px] text-gray-400">
                      Tidak ada suara? Klik untuk diagnosis
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Microphone permission help */}
            {micError && (
              <div className="border-t border-red-100 bg-red-50/60 px-4 py-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-red-700">
                      Mikrofon tidak bisa diakses
                    </p>
                    <p className="mt-1 text-xs text-red-600 leading-relaxed">{micError}</p>

                    <ol className="mt-2 space-y-1 text-xs text-gray-600 list-decimal list-inside">
                      <li>Klik ikon <strong>gembok / pengaturan situs</strong> di kiri address bar.</li>
                      <li>Cari <strong>Mikrofon</strong> → ubah ke <strong>Allow / Izinkan</strong>.</li>
                      <li>Muat ulang halaman (F5), lalu klik mikrofon lagi.</li>
                    </ol>
                    <p className="mt-1.5 text-[11px] text-gray-500">
                      Pastikan alamat diawali <code className="rounded bg-white px-1">https://</code> atau{" "}
                      <code className="rounded bg-white px-1">localhost</code> — browser memblokir mikrofon di HTTP/IP biasa.
                    </p>

                    <div className="mt-2 flex items-center gap-2">
                      <button
                        onClick={() => {
                          setMicError(null);
                          handleToggleListen();
                        }}
                        className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 transition-colors"
                      >
                        Coba Lagi
                      </button>
                      <button
                        onClick={() => setMicError(null)}
                        className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                      >
                        Tutup
                      </button>
                      <span className="text-[11px] text-gray-400">
                        Atau ketik saja di kolom chat
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Agent capabilities info */}
            <div className="border-t border-emerald-50 px-4 py-3 bg-emerald-50/30">
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                <div className="flex items-center gap-1.5">
                  <Shield className="w-3 h-3 text-emerald-500" />
                  Prompt Injection Guard
                </div>
                <div className="flex items-center gap-1.5">
                  <Shield className="w-3 h-3 text-emerald-500" />
                  Cultural Rules Engine
                </div>
                <div className="flex items-center gap-1.5">
                  <Shield className="w-3 h-3 text-emerald-500" />
                  Human Approval Required
                </div>
                <div className="flex items-center gap-1.5">
                  <Shield className="w-3 h-3 text-emerald-500" />
                  Full Audit Trail
                </div>
                <div className="flex items-center gap-1.5">
                  <BookOpen className="w-3 h-3 text-teal-500" />
                  Mode Ustadz Hafizh — Dalil Terverifikasi
                </div>
                <div className="flex items-center gap-1.5">
                  <Shield className="w-3 h-3 text-emerald-500" />
                  Tidak Berfatwa — Rujuk Ulama
                </div>
              </div>
              {injectionCount > 0 && (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-red-600 font-medium">
                  <AlertTriangle className="w-3 h-3" />
                  {injectionCount} upaya prompt injection diblokir
                </div>
              )}
            </div>
          </div>

          {/* Right: Chat Transcript + Input */}
          <div className="flex flex-col rounded-2xl border border-emerald-100 bg-white shadow-sm overflow-hidden">
            {/* Chat header */}
            <div className="border-b border-emerald-50 px-4 py-3">
              <h2 className="text-sm font-semibold text-gray-700">
                Percakapan dengan Asisten AI
              </h2>
              <p className="text-xs text-gray-400">
                {messages.length} pesan · Powered by CariUstadz Agent Flow
              </p>
            </div>

            {/* Transcript */}
            <TranscriptPanel messages={messages} isThinking={isThinking} />

            {/* Input */}
            <div className="border-t border-emerald-50 p-3">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ketik pesan atau gunakan mikrofon..."
                  className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim()}
                  className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-gray-300 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Audit Log Panel (collapsible) */}
        {showAuditLog && (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/50 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-amber-800 flex items-center gap-2">
                <ScrollText className="w-4 h-4" />
                Audit Log — Transparansi Agent
              </h3>
              <span className="text-xs text-amber-600">
                {auditEntries.length} entries
              </span>
            </div>
            {auditEntries.length === 0 ? (
              <p className="text-xs text-gray-500">Belum ada aktivitas yang tercatat.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {[...auditEntries].reverse().map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-lg bg-white border border-amber-100 px-3 py-2 text-xs"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-700 uppercase">
                        {entry.step.replace(/_/g, " ")}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded font-medium ${
                          entry.result === "success"
                            ? "bg-emerald-100 text-emerald-700"
                            : entry.result === "blocked"
                            ? "bg-red-100 text-red-700"
                            : entry.result === "failure"
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {entry.result}
                      </span>
                    </div>
                    <div className="text-gray-500">
                      <span className="text-gray-400">
                        {new Date(entry.timestamp).toLocaleTimeString("id-ID")}
                      </span>
                      {" — "}
                      {entry.input.slice(0, 80)}
                      {entry.input.length > 80 ? "..." : ""}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Quick prompts */}
        {messages.length <= 1 && (
          <div className="mt-4">
            <p className="text-xs text-gray-500 mb-2">Coba contoh berikut:</p>
            <div className="flex flex-wrap gap-2">
              {[
                "Cari ustadz fiqih di Jakarta",
                "Booking ustadz untuk kajian di Bandung, Senin jam 19:00",
                "Apa dalil tentang sabar?",
                "Keutamaan sedekah",
                "Rekomendasi ustadz terbaik",
                "Kajian mendatang",
              ].map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-xs text-emerald-700 hover:bg-emerald-50 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

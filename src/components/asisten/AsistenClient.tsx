"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Send, ScrollText, Camera, Palette } from "lucide-react";
import { avatarReducer, AvatarState, AvatarAction } from "@/lib/avatar/stateMachine";
import { logAudit, getAuditLog, AuditEntry } from "@/lib/ai/auditLog";
import { answer } from "@/lib/ai/answerEngine";
import { AgentContext, EMPTY_CONTEXT } from "@/lib/ai/agentContext";
import { addBooking, getBookings } from "@/lib/storage";
import { checkBooking } from "@/lib/bookingGuard";
import TranscriptPanel, { ChatMessage } from "./TranscriptPanel";
import Avatar2D from "@/components/avatar/Avatar2D";
import AvatarPhoto from "@/components/avatar/AvatarPhoto";

const STATE_LABELS: Partial<Record<AvatarState, string>> = {
  idle: "Siap membantu",
  thinking: "Menyusun jawaban...",
  greeting: "Menyapa",
  error: "Terjadi kesalahan",
};

export default function AsistenClient() {
  const [avatarState, dispatchAvatar] = useState<AvatarState>("idle");
  /** "photo" = wajah asli bergerak, "cartoon" = karakter SVG */
  const [avatarMode, setAvatarMode] = useState<"photo" | "cartoon">("photo");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const agentContextRef = useRef<AgentContext>(EMPTY_CONTEXT);

  const dispatch = useCallback((action: AvatarAction) => {
    dispatchAvatar((prev) => avatarReducer(prev, action));
  }, []);

  // Sapaan saat halaman dibuka
  useEffect(() => {
    const greetingTimer = setTimeout(() => {
      dispatch("GREET");
      const greetingMsg: ChatMessage = {
        id: `greeting-${Date.now()}`,
        role: "assistant",
        content:
          "Assalamu'alaikum. Ada yang bisa saya bantu? Anda bisa minta dicarikan ustadz, melihat kajian mendatang, atau bertanya dalil.",
        timestamp: Date.now(),
      };
      setMessages([greetingMsg]);
      setTimeout(() => dispatch("RESET"), 2000);
    }, 800);

    return () => clearTimeout(greetingTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      logAudit("parse", "user_input", text, "Processing user message", "success");

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: text,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
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
            bookingBlocked = guard.reason ?? "Undangan tidak bisa diproses.";
          }
        }

        // Audit (internal — tidak tampil sebagai teks ke pengguna)
        if (result.action === "blocked") {
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

        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          role: "assistant",
          content: bookingBlocked
            ? `Undangan tidak bisa diproses: ${bookingBlocked}\n\nSilakan sesuaikan permintaan Anda, atau buka halaman [Undang Ustadz](/booking) untuk mengelola undangan yang ada.`
            : result.reply,
          timestamp: Date.now(),
          action: result.action,
          injectionDetected: result.action === "blocked",
        };
        setMessages((prev) => [...prev, aiMsg]);
        setIsThinking(false);
      } catch (err) {
        console.error("Chat error:", err);
        setIsThinking(false);
        dispatch("ERROR");

        const errMsg: ChatMessage = {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: "Maaf, terjadi kesalahan. Silakan coba lagi.",
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, errMsg]);
        logAudit("error", "api_error", text, "Fetch failed", "failure");

        setTimeout(() => dispatch("RESET"), 2000);
      }
    },
    [messages, dispatch]
  );

  const handleReset = useCallback(() => {
    setMessages([]);
    setInput("");
    setIsThinking(false);
    agentContextRef.current = EMPTY_CONTEXT;
    dispatch("RESET");
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
              Asisten CariUstadz
            </h1>
            <p className="text-sm text-gray-500">
              Bantu cari dan undang ustadz terverifikasi
            </p>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={handleShowAudit}
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                showAuditLog
                  ? "bg-amber-100 text-amber-700"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <ScrollText className="w-3 h-3" />
              Riwayat ({auditEntries.length || getAuditLog().length})
            </button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
          {/* Left: Avatar */}
          <div className="flex flex-col rounded-2xl border border-emerald-100 bg-white shadow-sm overflow-hidden">
            <div className="relative h-[340px] sm:h-[420px] bg-gradient-to-b from-emerald-50/50 to-transparent">
              {avatarMode === "photo" ? (
                <AvatarPhoto state={avatarState} />
              ) : (
                <Avatar2D state={avatarState} />
              )}

              {/* Toggle mode avatar */}
              <button
                onClick={() =>
                  setAvatarMode((m) => (m === "photo" ? "cartoon" : "photo"))
                }
                className="absolute top-4 right-4 z-10 inline-flex items-center gap-1.5 rounded-full bg-white/90 backdrop-blur px-3 py-1.5 shadow-sm text-xs font-medium text-gray-700 hover:bg-white transition-colors"
                title="Ganti tampilan avatar"
              >
                {avatarMode === "photo" ? (
                  <>
                    <Palette className="h-3.5 w-3.5" />
                    Kartun
                  </>
                ) : (
                  <>
                    <Camera className="h-3.5 w-3.5" />
                    Foto
                  </>
                )}
              </button>

              {/* Indikator status */}
              <div className="absolute top-4 left-4 flex items-center gap-2 rounded-full bg-white/90 backdrop-blur px-3 py-1.5 shadow-sm">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    avatarState === "thinking"
                      ? "bg-amber-500 animate-pulse"
                      : avatarState === "error"
                      ? "bg-red-500"
                      : "bg-emerald-500"
                  }`}
                />
                <span className="text-xs font-medium text-gray-700">
                  {STATE_LABELS[avatarState] ?? "Siap membantu"}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Chat Transcript + Input */}
          <div className="flex flex-col rounded-2xl border border-emerald-100 bg-white shadow-sm overflow-hidden">
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
                  placeholder="Ketik pesan Anda..."
                  className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim()}
                  aria-label="Kirim"
                  className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-gray-300 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Riwayat aktivitas (collapsible) */}
        {showAuditLog && (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/50 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-amber-800 flex items-center gap-2">
                <ScrollText className="w-4 h-4" />
                Riwayat Aktivitas
              </h3>
              <button
                onClick={handleShowAudit}
                className="text-xs text-amber-600 hover:text-amber-800"
              >
                Tutup
              </button>
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
                            : entry.result === "blocked" || entry.result === "failure"
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

        {/* Contoh pertanyaan */}
        {messages.length <= 1 && (
          <div className="mt-4">
            <p className="text-xs text-gray-500 mb-2">Coba contoh berikut:</p>
            <div className="flex flex-wrap gap-2">
              {[
                "Cari ustadz fiqih di Jakarta",
                "Undang ustadz untuk kajian di Bandung, Senin jam 19:00",
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

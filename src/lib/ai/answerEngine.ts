"use client";

/**
 * Mesin jawaban asisten.
 *
 * Urutan:
 *   1. Scope guard  -> tolak pertanyaan di luar domain sebelum menyentuh model
 *   2. LLM WorkBuddy (jika sudah dikonfigurasi)
 *   3. Validasi keluaran -> sensor kontak, deteksi nama ustadz karangan
 *   4. Fallback mesin lokal berbasis aturan bila LLM tidak tersedia atau gagal
 *
 * Hasilnya: jawaban selalu dalam konteks CariUstadz, dan tidak bergantung
 * pada satu penyedia saja.
 */

import { AgentContext, EMPTY_CONTEXT } from "./agentContext";
import {
  checkScope,
  redactContactBeforeApproval,
  detectUnknownUstadzNames,
  ScopeVerdict,
} from "./scopeGuard";
import { isLLMConfigured, chatWithWorkBuddy, ChatTurn } from "./llmProvider";
import { buildGroundedSystemPrompt } from "./groundedPrompt";
import { matchIntent, PendingBookingPayload } from "./intentMatcher";
import { handleDalilRequest } from "./expertHafizh";
import { formatVerifiedRows } from "./grounding";
import { ustadzData } from "@/lib/data";

export type AnswerProvider = "workbuddy" | "deepseek" | "openrouter" | "local";

export interface AnswerResult {
  reply: string;
  action?: string;
  context: AgentContext;
  provider: AnswerProvider;
  scope: ScopeVerdict;
  booking?: PendingBookingPayload;
  /** Alasan bila LLM gagal dan jatuh ke mesin lokal */
  fallbackReason?: string;
}

const KNOWN_NAMES = ustadzData.map((u) => u.name);

/**
 * Aksi yang teksnya WAJIB dari mesin lokal.
 * Rencana booking butuh format baku dan angka yang persis; profil memuat
 * jadwal asli; penolakan dan permintaan klarifikasi harus deterministik.
 * Menyerahkannya ke LLM berisiko mengubah detail yang harus tepat.
 */
const LOCAL_ONLY_ACTIONS = new Set<string>([
  "booking_plan",
  "booking_confirmed",
  "booking_cancelled",
  "profile",
  "clarify",
  "blocked",
  "refused",
]);

function toChatTurns(
  history: Array<{ role: "user" | "assistant"; content: string }>
): ChatTurn[] {
  return history.slice(-8).map((h) => ({ role: h.role, content: h.content }));
}

/**
 * LLM tidak pernah tahu ID internal ustadz, jadi jawabannya tidak bisa
 * memuat tautan ke halaman booking. Mesin lokal sudah menyusun tautan
 * itu dengan benar — pastikan tautan internal dari teks lokal tetap ada
 * di jawaban akhir, tanpa menduplikasi yang sudah ditulis LLM.
 */
function ensureLinks(llmReply: string, localText: string): string {
  const links = localText.match(/\[[^\]]+\]\(\/[^)]+\)/g) ?? [];
  const missing = links.filter((l) => !llmReply.includes(l));
  if (missing.length === 0) return llmReply;
  return `${llmReply.trim()}\n\n${missing.join("\n")}`;
}

/** Validasi jawaban model sebelum ditampilkan. */
function validateLLMAnswer(
  raw: string,
  ctx: AgentContext
): { ok: true; text: string } | { ok: false; reason: string } {
  const text = raw.trim();
  if (text.length < 3) {
    return { ok: false, reason: "jawaban kosong" };
  }

  // Nama ustadz yang tidak ada di database berarti halusinasi
  const unknown = detectUnknownUstadzNames(text, KNOWN_NAMES);
  if (unknown.length > 0) {
    return { ok: false, reason: `nama ustadz tidak dikenal: ${unknown.join(", ")}` };
  }

  // Nomor kontak hanya boleh muncul setelah booking dikonfirmasi
  const bookingConfirmed = ctx.lastAction === "booking_confirmed";
  return { ok: true, text: redactContactBeforeApproval(text, bookingConfirmed) };
}

/** Status penyedia LLM server-side (DeepSeek + cadangan OpenRouter). */
export async function getServerLLMStatus(): Promise<{
  configured: boolean;
  label: string;
  backup: string | null;
}> {
  try {
    const res = await fetch("/api/llm", { method: "GET" });
    if (!res.ok) return { configured: false, label: "Mesin lokal", backup: null };
    const data = (await res.json()) as {
      configured?: boolean;
      primary?: { provider: string; model: string } | null;
      backup?: { provider: string; model: string } | null;
    };
    if (!data.configured || !data.primary) {
      return { configured: false, label: "Mesin lokal", backup: null };
    }
    const label =
      data.primary.provider === "deepseek"
        ? `DeepSeek ${data.primary.model}`
        : `OpenRouter ${data.primary.model}`;
    return {
      configured: true,
      label,
      backup: data.backup ? `cadangan ${data.backup.model}` : null,
    };
  } catch {
    return { configured: false, label: "Mesin lokal", backup: null };
  }
}

/**
 * Minta jawaban dari LLM lewat server (DeepSeek, dengan cadangan OpenRouter).
 * Mengembalikan null bila belum dikonfigurasi, di luar domain, atau gagal —
 * pemanggil yang memutuskan untuk jatuh ke mesin lokal.
 */
async function askServerLLM(
  message: string,
  ctx: AgentContext,
  history: Array<{ role: "user" | "assistant"; content: string }>,
  verified?: string,
  extra?: { mode?: string; verifiedDalil?: string }
): Promise<{ reply: string; provider: AnswerProvider } | null> {
  try {
    const res = await fetch("/api/llm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        history: history.slice(-8),
        bookingConfirmed: ctx.lastAction === "booking_confirmed",
        verified: extra?.verifiedDalil ?? verified,
        mode: extra?.mode,
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { reply?: string; provider?: string };
    const reply = (data.reply ?? "").trim();
    if (reply.length < 3) return null;

    const provider: AnswerProvider = (data.provider ?? "").startsWith(
      "openrouter"
    )
      ? "openrouter"
      : "deepseek";
    return { reply, provider };
  } catch {
    return null;
  }
}

export async function answer(
  message: string,
  context: AgentContext = EMPTY_CONTEXT,
  history: Array<{ role: "user" | "assistant"; content: string }> = []
): Promise<AnswerResult> {
  const scope = checkScope(message);

  /* 1. Di luar domain — jangan panggil model sama sekali */
  if (scope.verdict !== "in_scope") {
    /* 1b. Pertanyaan dalil → Mode Ustadz Hafizh (bukan penolakan) */
    if (scope.verdict === "dalil_request") {
      const localDalil = handleDalilRequest(message);
      const ctxDalil = {
        ...context,
        turn: context.turn + 1,
        lastAction: localDalil.blocked ? "injection_blocked" : "dalil",
      };

      // Coba LLM hafizh (prompt terkunci pada dalil terverifikasi).
      // Gagal / tidak dikonfigurasi → jawaban lokal deterministik.
      const serverReply = await askServerLLM(message, context, history, undefined, {
        mode: "hafizh",
        verifiedDalil: localDalil.sourcesText || undefined,
      });
      if (serverReply && !localDalil.blocked) {
        return {
          reply: serverReply.reply,
          action: "dalil",
          context: ctxDalil,
          provider: serverReply.provider,
          scope: scope.verdict,
        };
      }

      return {
        reply: localDalil.text,
        action: localDalil.blocked ? "blocked" : "dalil",
        context: ctxDalil,
        provider: "local",
        scope: scope.verdict,
      };
    }

    const local = matchIntent(message, context);
    return {
      reply: local.text,
      action: local.action,
      context: local.context ?? context,
      provider: "local",
      scope: scope.verdict,
    };
  }

  /* 2. Mesin lokal dijalankan lebih dulu untuk mengetahui aksinya */
  const local = matchIntent(message, context);

  const fromLocal = (extra: Partial<AnswerResult> = {}): AnswerResult => ({
    reply: local.text,
    action: local.action,
    context: local.context ?? { ...context, turn: context.turn + 1 },
    provider: "local",
    scope: scope.verdict,
    booking: local.booking,
    ...extra,
  });

  // Aksi terstruktur ditangani mesin lokal, bukan LLM: rencana booking punya
  // format baku dan angka yang harus persis, profil memuat jadwal asli, dan
  // penolakan harus deterministik. LLM hanya untuk jawaban naratif.
  if (local.action && LOCAL_ONLY_ACTIONS.has(local.action)) {
    return fromLocal();
  }

  /* 3. Jalur LLM server: DeepSeek → cadangan OpenRouter */
  const verifiedRows = local.data?.list?.length
    ? formatVerifiedRows(local.data.list)
    : undefined;

  const serverReply = await askServerLLM(
    message,
    context,
    history,
    verifiedRows
  );
  if (serverReply) {
    return {
      reply: ensureLinks(serverReply.reply, local.text),
      action: local.action,
      context: local.context ?? { ...context, turn: context.turn + 1 },
      provider: serverReply.provider,
      scope: scope.verdict,
      booking: local.booking,
    };
  }

  /* 4. Jalur LLM WorkBuddy */
  if (isLLMConfigured()) {
    try {
      const raw = await chatWithWorkBuddy({
        systemPrompt: buildGroundedSystemPrompt(),
        history: toChatTurns(history),
        userMessage: message,
        temperature: 0.5,
        maxTokens: 700,
      });

      const checked = validateLLMAnswer(raw, context);
      if (checked.ok) {
        return {
          reply: ensureLinks(checked.text, local.text),
          action: local.action,
          context: local.context ?? { ...context, turn: context.turn + 1 },
          provider: "workbuddy",
          scope: scope.verdict,
          booking: local.booking,
        };
      }

      // Gagal validasi — jangan tampilkan jawaban berisiko
      return fromLocal({ fallbackReason: checked.reason });
    } catch (err) {
      const reason = err instanceof Error ? err.message : "kesalahan tidak dikenal";
      return fromLocal({ fallbackReason: reason });
    }
  }

  /* 5. Mesin lokal murni */
  return fromLocal();
}

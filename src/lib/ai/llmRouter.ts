/**
 * Rantai penyedia LLM — KHUSUS SERVER.
 *
 * Urutan bawaan:
 *   DeepSeek → OpenRouter termurah → OpenRouter gratis.
 *
 * Kenapa yang berbayar murah didahulukan daripada yang gratis? Saat diuji,
 * permintaan gratis yang dikirim bersamaan memicu pembatasan laju OpenRouter
 * dan ikut menahan permintaan berikutnya (respons > 20 detik). Model termurah
 * hanya sekitar $0,03 per juta token — untuk demo, keandalan lebih penting
 * daripada mengejar nol biaya.
 *
 * Set OPENROUTER_PREFER_FREE=true bila ingin mencoba yang gratis lebih dulu.
 */

import {
  chatWithDeepSeek,
  isDeepSeekConfigured,
  getDeepSeekModel,
} from "./deepseekProvider";
import {
  chatWithOpenRouter,
  isOpenRouterConfigured,
  FREE_MODEL_CHAIN,
  getCheapModel,
} from "./openrouterProvider";
import { looksLikeReasoningLeak } from "./replyQuality";

export type LlmProvider = "deepseek" | "openrouter-free" | "openrouter-cheap";

export interface LlmReply {
  text: string;
  provider: LlmProvider;
  model: string;
}

export interface LlmRequest {
  systemPrompt: string;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
  userMessage: string;
}

function messageOf(err: unknown): string {
  return err instanceof Error ? err.message : "kesalahan tidak dikenal";
}

/** Tolak keluaran yang berisi proses berpikir, bukan jawaban. */
async function attempt(
  model: string,
  req: LlmRequest,
  timeoutMs: number
): Promise<string> {
  const text = await chatWithOpenRouter({ ...req, model, timeoutMs });
  if (looksLikeReasoningLeak(text)) {
    throw new Error(`${model}: jawaban berisi proses berpikir, bukan hasil`);
  }
  return text;
}

/**
 * Model gratis dicoba BERURUTAN dengan batas tunggu pendek.
 * Dikirim bersamaan justru memicu pembatasan laju dan memperlambat semuanya.
 */
async function tryFreeModels(
  req: LlmRequest
): Promise<{ text: string; model: string }> {
  const errors: string[] = [];
  for (const model of FREE_MODEL_CHAIN) {
    try {
      const text = await attempt(model, req, 7_000);
      return { text, model };
    } catch (err) {
      errors.push(`${model}: ${messageOf(err).slice(0, 80)}`);
    }
  }
  throw new Error(errors.join(" | "));
}

export async function generateReply(req: LlmRequest): Promise<LlmReply> {
  const errors: string[] = [];

  /* 1. DeepSeek langsung — paling murah dan paling cepat saat sehat */
  if (isDeepSeekConfigured()) {
    try {
      const text = await chatWithDeepSeek(req);
      if (!looksLikeReasoningLeak(text)) {
        return { text, provider: "deepseek", model: getDeepSeekModel() };
      }
      errors.push("deepseek: jawaban berisi proses berpikir");
    } catch (err) {
      errors.push(`deepseek: ${messageOf(err)}`);
    }
  }

  if (isOpenRouterConfigured()) {
    const preferFree = process.env.OPENROUTER_PREFER_FREE === "true";
    const cheap = getCheapModel();

    const runCheap = async (): Promise<LlmReply | null> => {
      try {
        const text = await attempt(cheap, req, 25_000);
        return { text, provider: "openrouter-cheap", model: cheap };
      } catch (err) {
        errors.push(`${cheap}: ${messageOf(err)}`);
        return null;
      }
    };

    const runFree = async (): Promise<LlmReply | null> => {
      try {
        const won = await tryFreeModels(req);
        return {
          text: won.text,
          provider: "openrouter-free",
          model: won.model,
        };
      } catch (err) {
        errors.push(`openrouter-free: ${messageOf(err).slice(0, 120)}`);
        return null;
      }
    };

    const order = preferFree ? [runFree, runCheap] : [runCheap, runFree];
    for (const step of order) {
      const result = await step();
      if (result) return result;
    }
  }

  throw new Error(
    errors.join(" | ") || "Tidak ada penyedia LLM yang dikonfigurasi"
  );
}

/** Ringkasan status untuk ditampilkan di UI. */
export function getProviderStatus() {
  return {
    configured: isDeepSeekConfigured() || isOpenRouterConfigured(),
    primary: isDeepSeekConfigured()
      ? { provider: "deepseek" as const, model: getDeepSeekModel() }
      : isOpenRouterConfigured()
      ? { provider: "openrouter-cheap" as const, model: getCheapModel() }
      : null,
    // Cadangan pertama yang benar-benar dipakai setelah DeepSeek gagal.
    backup: isOpenRouterConfigured()
      ? { provider: "openrouter-cheap" as const, model: getCheapModel() }
      : null,
  };
}

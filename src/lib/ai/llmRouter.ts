/**
 * Rantai penyedia LLM — KHUSUS SERVER.
 *
 * Urutan sejak 3 Nov 2026 (kunci DeepSeek dihapus, saldo habis):
 *   OpenRouter gratis → OpenRouter termurah.
 *
 * Kenapa gratis didahulukan? Permintaan pengguna demo mayoritas pendek dan
 * tidak kritis latensi; model gratis diuji live menjawab ~1 detik di luar
 * jam sibuk. Model termurah (gpt-oss-120b, ~$0,03 per juta token) hanya
 * dipanggil bila semua model gratis kena batas laju.
 *
 * DeepSeek masih didukung kode: bila DEEPSEEK_API_KEY diisi kembali,
 * ia otomatis mendahului OpenRouter.
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
  const preferFree = process.env.OPENROUTER_PREFER_FREE === "true";
  return {
    configured: isDeepSeekConfigured() || isOpenRouterConfigured(),
    primary: isDeepSeekConfigured()
      ? { provider: "deepseek" as const, model: getDeepSeekModel() }
      : isOpenRouterConfigured()
      ? preferFree
        ? ({ provider: "openrouter-free" as const, model: FREE_MODEL_CHAIN[0] } as const)
        : { provider: "openrouter-cheap" as const, model: getCheapModel() }
      : null,
    // Cadangan: model termurah bila semua model gratis kena batas laju.
    backup: isOpenRouterConfigured()
      ? { provider: "openrouter-cheap" as const, model: getCheapModel() }
      : null,
  };
}

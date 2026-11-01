/**
 * Adapter OpenRouter — KHUSUS SERVER (cadangan bila saldo DeepSeek habis).
 *
 * Strategi dua lapis:
 *  1. Model gratis lebih dulu (`:free`) — tanpa biaya, tapi sering kena
 *     batas laju 429, jadi dicoba berurutan.
 *  2. Model berbayar termurah bila semua yang gratis gagal.
 *
 * Kunci tetap di server; tidak pernah dikirim ke browser.
 */

export interface OpenRouterTurn {
  role: "user" | "assistant";
  content: string;
}

export interface OpenRouterOptions {
  systemPrompt: string;
  history?: OpenRouterTurn[];
  userMessage: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  /** Batas tunggu per model. Model gratis dipangkas agar cadangan cepat diambil. */
  timeoutMs?: number;
}

const BASE_URL = "https://openrouter.ai/api/v1";

/**
 * Urutan percobaan model gratis. Diurutkan dari yang paling stabil saat diuji
 * (31 Okt 2026): nemotron merespons normal, sebagian lain kena 429.
 */
export const FREE_MODEL_CHAIN = [
  "nvidia/nemotron-3-ultra-550b-a55b:free",
  "google/gemma-4-31b-it:free",
  "google/gemma-4-26b-a4b-it:free",
];

export function getCheapModel(): string {
  return process.env.OPENROUTER_CHEAP_MODEL || "mistralai/mistral-nemo";
}

export function isOpenRouterConfigured(): boolean {
  return Boolean(process.env.OPENROUTER_API_KEY?.trim());
}

export async function chatWithOpenRouter(
  opts: OpenRouterOptions
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) throw new Error("OPENROUTER_API_KEY belum diisi");

  const messages = [
    { role: "system", content: opts.systemPrompt },
    ...(opts.history ?? []).slice(-8).map((h) => ({
      role: h.role,
      content: h.content,
    })),
    { role: "user", content: opts.userMessage },
  ];

  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      // OpenRouter memakai dua header ini untuk atribusi aplikasi.
      "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
      "X-Title": "CariUstadz",
    },
    body: JSON.stringify({
      model: opts.model,
      messages,
      temperature: opts.temperature ?? 0.5,
      max_tokens: opts.maxTokens ?? 700,
      stream: false,
    }),
    signal: AbortSignal.timeout(opts.timeoutMs ?? 20_000),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`OpenRouter ${res.status}: ${detail.slice(0, 160)}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = (data.choices?.[0]?.message?.content ?? "").trim();
  if (!text) throw new Error("OpenRouter mengembalikan jawaban kosong");
  return text;
}

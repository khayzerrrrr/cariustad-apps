/**
 * Adapter DeepSeek — KHUSUS SERVER.
 *
 * Jangan pernah mengimpor berkas ini dari komponen klien: API key harus
 * tetap di server. Semua panggilan lewat `/api/llm`.
 *
 * Model default `deepseek-flash` (DeepSeek-V4.1-Flash) adalah yang paling
 * murah di katalog DeepSeek. Mode "thinking" dimatikan karena untuk
 * percakapan asisten ia hanya menambah biaya dan jeda tanpa manfaat nyata.
 */

export interface DeepSeekTurn {
  role: "user" | "assistant";
  content: string;
}

export interface DeepSeekOptions {
  systemPrompt: string;
  history?: DeepSeekTurn[];
  userMessage: string;
  temperature?: number;
  maxTokens?: number;
}

const BASE_URL = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";
const MODEL = process.env.DEEPSEEK_MODEL || "deepseek-flash";

export function getDeepSeekModel(): string {
  return MODEL;
}

export function isDeepSeekConfigured(): boolean {
  return Boolean(process.env.DEEPSEEK_API_KEY?.trim());
}

export async function chatWithDeepSeek(opts: DeepSeekOptions): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY?.trim();
  if (!apiKey) throw new Error("DEEPSEEK_API_KEY belum diisi");

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
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: opts.temperature ?? 0.5,
      max_tokens: opts.maxTokens ?? 700,
      stream: false,
      // Mode berpikir dimatikan: lebih cepat dan lebih murah.
      thinking: { type: "disabled" },
    }),
    signal: AbortSignal.timeout(20_000),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`DeepSeek ${res.status}: ${detail.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return (data.choices?.[0]?.message?.content ?? "").trim();
}

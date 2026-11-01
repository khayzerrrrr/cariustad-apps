"use client";

/**
 * Adapter LLM WorkBuddy — tanpa API key.
 *
 * Memakai SDK resmi `@tencent-ai/workbuddy-cloud-sdk` dan hanya aktif
 * jika CLOUD_PUBLIC_CONFIG sudah diisi. Jika belum, seluruh fungsi di sini
 * tidak dipanggil dan asisten memakai mesin lokal.
 *
 * API hanya mendukung streaming (`stream: true`), jadi teks dikumpulkan
 * dari potongan SSE lalu dikembalikan utuh.
 */

import { CLOUD_PUBLIC_CONFIG } from "./cloudConfig";

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export interface LLMChatOptions {
  systemPrompt: string;
  history?: ChatTurn[];
  userMessage: string;
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
}

type CloudClient = {
  llm: {
    models: { list: () => Promise<Array<{ id: string; name?: string; disabled?: boolean }>> };
    chat: {
      completions: {
        create: (input: Record<string, unknown>) => AsyncIterable<unknown>;
      };
    };
  };
};

let clientPromise: Promise<CloudClient> | null = null;
let cachedModelId: string | null = null;

/** Apakah LLM WorkBuddy sudah dikonfigurasi? */
export function isLLMConfigured(): boolean {
  return Boolean(
    CLOUD_PUBLIC_CONFIG?.endpoint && CLOUD_PUBLIC_CONFIG?.publishableKey
  );
}

async function getClient(): Promise<CloudClient> {
  if (!isLLMConfigured()) {
    throw new Error("LLM WorkBuddy belum dikonfigurasi");
  }
  if (!clientPromise) {
    clientPromise = (async () => {
      const mod = await import("@tencent-ai/workbuddy-cloud-sdk");
      return mod.createWorkBuddyCloud({
        endpoint: CLOUD_PUBLIC_CONFIG!.endpoint,
        oauthRelayBaseUrl: CLOUD_PUBLIC_CONFIG!.oauthRelayBaseUrl,
        publishableKey: CLOUD_PUBLIC_CONFIG!.publishableKey,
      }) as unknown as CloudClient;
    })();
  }
  return clientPromise;
}

async function pickModel(client: CloudClient): Promise<string | null> {
  if (cachedModelId) return cachedModelId;
  const models = await client.llm.models.list();
  if (!models || models.length === 0) return null;
  const usable = models.find((m) => m.disabled !== true);
  if (!usable) return null;
  cachedModelId = usable.id;
  return cachedModelId;
}

/** Kirim percakapan ke LLM WorkBuddy dan kembalikan jawaban utuh. */
export async function chatWithWorkBuddy(opts: LLMChatOptions): Promise<string> {
  const client = await getClient();
  const model = await pickModel(client);
  if (!model) throw new Error("Tidak ada model yang tersedia");

  const messages: Array<{ role: string; content: string }> = [
    { role: "system", content: opts.systemPrompt },
    ...(opts.history ?? []).slice(-8).map((h) => ({
      role: h.role,
      content: h.content,
    })),
    { role: "user", content: opts.userMessage },
  ];

  let text = "";
  const stream = client.llm.chat.completions.create({
    model,
    messages,
    stream: true,
    temperature: opts.temperature ?? 0.6,
    max_tokens: opts.maxTokens ?? 700,
    signal: opts.signal,
  });

  for await (const chunk of stream) {
    const choice = (chunk as { choices?: Array<{ delta?: { content?: string } }> })
      ?.choices?.[0];
    const delta = choice?.delta?.content;
    if (delta) text += delta;
  }

  return text.trim();
}

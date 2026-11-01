import { NextRequest, NextResponse } from "next/server";
import { matchIntent } from "@/lib/ai/intentMatcher";
import { checkScope } from "@/lib/ai/scopeGuard";
import { detectPromptInjection } from "@/lib/ai/promptGuard";
import { AgentContext, EMPTY_CONTEXT } from "@/lib/ai/agentContext";

/**
 * Endpoint cadangan (server-side).
 *
 * Asisten di /asisten memanggil LLM WorkBuddy langsung dari browser, karena
 * SDK-nya memakai publishable key yang terikat ke Origin aplikasi. Route ini
 * berfungsi sebagai jalur cadangan deterministik: ia tetap menjaga batas
 * domain lewat scope guard, lalu menjawab dengan mesin aturan lokal.
 *
 * Tidak ada panggilan ke OpenAI di sini — seluruh kecerdasan berasal dari
 * WorkBuddy Cloud (LLM gratis tanpa API key) atau mesin lokal.
 */

export interface ChatRequest {
  message: string;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
  context?: AgentContext;
}

export interface ChatResponse {
  reply: string;
  action?: string;
  context?: AgentContext;
  scope?: string;
  auditStep?: string;
  injectionDetected?: boolean;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ChatRequest;
    const message = body?.message;

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Pesan tidak valid" }, { status: 400 });
    }

    const injectionCheck = detectPromptInjection(message);
    const scope = checkScope(message);
    const result = matchIntent(message, body.context ?? EMPTY_CONTEXT);

    const response: ChatResponse = {
      reply: result.text,
      action: result.action,
      context: result.context,
      scope: scope.verdict,
      auditStep: result.action,
      injectionDetected: injectionCheck.isInjection,
    };

    return NextResponse.json(response);
  } catch {
    return NextResponse.json(
      { error: "Terjadi kesalahan internal" },
      { status: 500 }
    );
  }
}

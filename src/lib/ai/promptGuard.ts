/**
 * Prompt Injection Guard — Mendeteksi dan memblokir upaya prompt injection
 * Implements: pattern matching for injection attempts, input sanitization
 */

export interface InjectionCheckResult {
  isInjection: boolean;
  patterns: string[];
  sanitizedInput: string;
  warning?: string;
}

/** Patterns that indicate prompt injection attempts */
const INJECTION_PATTERNS: Array<{ regex: RegExp; label: string }> = [
  { regex: /\[system\s*:/i, label: "Bracket SYSTEM directive" },
  { regex: /\{system\s*:/i, label: "Brace SYSTEM directive" },
  { regex: /<system\s*:/i, label: "Angle SYSTEM directive" },
  { regex: /abaikan\s+(semua\s+)?(aturan|instruksi|perintah|pedoman)/i, label: "Ignore rules directive" },
  { regex: /instruksi\s+sebelumnya/i, label: "Previous instruction reference" },
  { regex: /(system|prompt)\s*(prompt)?\s*(asli|awal|internal)/i, label: "System prompt exfiltration" },
  { regex: /tampilkan\s+(system|prompt|instruksi)/i, label: "Reveal instruction directive" },
  { regex: /lupa\s+peran|forget\s+(your\s+)?role/i, label: "Forget role directive" },
  { regex: /kamu\s+adalah\s+(sekarang|now)/i, label: "Role reassignment" },
  { regex: /jangan\s+tanya|don'?t\s+ask/i, label: "Skip clarification directive" },
  { regex: /langsung\s+(konfirmasi|eksekusi|booking)/i, label: "Direct execution directive" },
  { regex: /tanpa\s+persetujuan|without\s+(approval|consent)/i, label: "Bypass consent directive" },
  { regex: /mode\s+(developer|admin|root)/i, label: "Privilege escalation" },
  { regex: /\bignore\s+(all\s+)?(previous|above)\b/i, label: "Ignore previous instructions" },
  { regex: /rahasia|secret|hidden\s+instruction/i, label: "Hidden instruction marker" },
];

/** Check input for prompt injection attempts */
export function detectPromptInjection(input: string): InjectionCheckResult {
  const patterns: string[] = [];

  for (const { regex, label } of INJECTION_PATTERNS) {
    if (regex.test(input)) {
      patterns.push(label);
    }
  }

  const isInjection = patterns.length > 0;

  // Sanitize: remove bracketed directives but keep the rest as data
  let sanitizedInput = input;
  if (isInjection) {
    sanitizedInput = input
      .replace(/\[system\s*:.*?\]/gi, "[REDACTED]")
      .replace(/\{system\s*:.*?\}/gi, "{REDACTED}")
      .replace(/<system\s*:.*?>/gi, "<REDACTED>");
  }

  return {
    isInjection,
    patterns,
    sanitizedInput,
    warning: isInjection
      ? `Terdeteksi upaya prompt injection (${patterns.length} pola: ${patterns.join(", ")}). Input diperlakukan sebagai data, aturan agent tetap berlaku.`
      : undefined,
  };
}

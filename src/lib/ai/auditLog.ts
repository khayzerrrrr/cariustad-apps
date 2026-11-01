/**
 * Audit Log — Mencatat setiap aksi agent untuk transparansi & akuntabilitas
 * Implements: "Menyimpan catatan" rule from hackathon strategy
 */

export interface AuditEntry {
  id: string;
  timestamp: string;
  step: AgentStep;
  action: string;
  input: string;
  output: string;
  result: "success" | "failure" | "warning" | "blocked";
  metadata?: Record<string, unknown>;
}

export type AgentStep =
  | "parse"
  | "search"
  | "cultural_check"
  | "clarify"
  | "plan"
  | "human_approval"
  | "execute"
  | "injection_blocked"
  | "error";

const AUDIT_LOG_KEY = "cariustadz_audit_log";

/** Get all audit entries from storage */
export function getAuditLog(): AuditEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(AUDIT_LOG_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/** Add a new audit entry */
export function logAudit(
  step: AgentStep,
  action: string,
  input: string,
  output: string,
  result: AuditEntry["result"] = "success",
  metadata?: Record<string, unknown>
): AuditEntry {
  const entry: AuditEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    step,
    action,
    input: input.slice(0, 500),
    output: output.slice(0, 500),
    result,
    metadata,
  };

  if (typeof window !== "undefined") {
    const log = getAuditLog();
    log.push(entry);
    // Keep last 200 entries
    const trimmed = log.slice(-200);
    localStorage.setItem(AUDIT_LOG_KEY, JSON.stringify(trimmed));
  }

  return entry;
}

/** Clear audit log */
export function clearAuditLog(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUDIT_LOG_KEY);
}

/** Get formatted audit log text for display */
export function formatAuditLog(): string {
  const log = getAuditLog();
  if (log.length === 0) return "Audit log kosong.";

  return log
    .map(
      (e) =>
        `[${e.timestamp}] ${e.step.toUpperCase()} — ${e.action}\n  Input: ${e.input.slice(0, 100)}\n  Output: ${e.output.slice(0, 100)}\n  Result: ${e.result}`
    )
    .join("\n\n");
}

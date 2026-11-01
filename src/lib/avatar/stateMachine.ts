export type AvatarState =
  | "idle"
  | "listening"
  | "thinking"
  | "speaking"
  | "greeting"
  | "error";

export const STATE_LABELS: Record<AvatarState, string> = {
  idle: "Siap membantu",
  listening: "Mendengarkan...",
  thinking: "Berfikir...",
  speaking: "Berbicara...",
  greeting: "Menyapa",
  error: "Terjadi kesalahan",
};

export const STATE_COLORS: Record<AvatarState, string> = {
  idle: "bg-slate-400",
  listening: "bg-red-500",
  thinking: "bg-amber-500",
  speaking: "bg-emerald-500",
  greeting: "bg-gold-500",
  error: "bg-red-600",
};

export type AvatarAction =
  | "START_LISTENING"
  | "STOP_LISTENING"
  | "USER_INPUT"
  | "RESPONSE_READY"
  | "START_SPEAKING"
  | "STOP_SPEAKING"
  | "ERROR"
  | "GREET"
  | "RESET";

export function avatarReducer(state: AvatarState, action: AvatarAction): AvatarState {
  switch (action) {
    case "START_LISTENING":
      return "listening";
    case "STOP_LISTENING":
      return state === "listening" ? "idle" : state;
    case "USER_INPUT":
      return "thinking";
    case "RESPONSE_READY":
      return "speaking";
    case "START_SPEAKING":
      return "speaking";
    case "STOP_SPEAKING":
      return "idle";
    case "ERROR":
      return "error";
    case "GREET":
      return "greeting";
    case "RESET":
      return "idle";
    default:
      return state;
  }
}

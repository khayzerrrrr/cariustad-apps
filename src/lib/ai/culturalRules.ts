/**
 * Cultural Rules Engine — Kesadaran Budaya Islam untuk Agent CariUstadz
 * Implements: Salat Jumat conflict, prayer time awareness, gender preference
 */

export interface CulturalCheckResult {
  passed: boolean;
  conflicts: string[];
  suggestions: string[];
}

/** Check if requested time conflicts with Salat Jumat (Friday congregational prayer) */
export function checkSalatJumatConflict(
  dayName: string,
  startTime: string
): boolean {
  const day = dayName.toLowerCase();
  if (day !== "jumat" && day !== "friday" && day !== "fri") return false;

  // Salat Jumat is typically 11:30 - 13:00 WIB
  const hour = parseInt(startTime.split(":")[0]);
  const minute = parseInt(startTime.split(":")[1] || "0");
  const timeMinutes = hour * 60 + minute;

  // Conflict window: 11:30 (690) to 13:00 (780)
  return timeMinutes >= 690 && timeMinutes < 780;
}

/** Prayer times (approximate WIB) — can be overridden by actual prayer time API */
export const DEFAULT_PRAYER_TIMES = {
  subuh: "04:45",
  dzuhur: "12:00",
  ashar: "15:15",
  maghrib: "18:00",
  isya: "19:00",
};

/** Check if requested time overlaps with any prayer time */
export function checkPrayerTimeConflict(
  startTime: string,
  endTime: string
): string[] {
  const conflicts: string[] = [];
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);

  // Only flag if prayer time falls strictly WITHIN the event window
  // (with small 5-min margin so events starting right at prayer time are OK)
  const margin = 5;

  for (const [name, time] of Object.entries(DEFAULT_PRAYER_TIMES)) {
    const prayerTime = timeToMinutes(time);
    if (
      start < prayerTime - margin &&
      end > prayerTime + margin
    ) {
      conflicts.push(name);
    }
  }

  return conflicts;
}

/** Check gender preference — should we recommend ustadzah? */
export function shouldRecommendUstadzah(message: string): boolean {
  const msg = message.toLowerCase();
  const muslimahKeywords = [
    "muslimah",
    "perempuan",
    "wanita",
    "ibu-ibu",
    "hijab",
    "ustadzah",
    "female",
  ];
  return muslimahKeywords.some((k) => msg.includes(k));
}

/** Comprehensive cultural check for a booking request */
export function checkCulturalRules(params: {
  day?: string;
  startTime?: string;
  endTime?: string;
  message: string;
}): CulturalCheckResult {
  const conflicts: string[] = [];
  const suggestions: string[] = [];

  // 1. Salat Jumat conflict
  if (params.day && params.startTime) {
    if (checkSalatJumatConflict(params.day, params.startTime)) {
      conflicts.push("Waktu yang diminta bertepatan dengan Salat Jumat (Jumat 11:30-13:00 WIB)");
      suggestions.push("Usulkan waktu setelah 13:00 WIB atau pindah ke hari lain");
    }
  }

  // 2. Prayer time conflict
  if (params.startTime && params.endTime) {
    const prayerConflicts = checkPrayerTimeConflict(params.startTime, params.endTime);
    for (const p of prayerConflicts) {
      conflicts.push(`Waktu bertepatan dengan salat ${p}`);
      suggestions.push(`Saran: jeda 15 menit setelah salat ${p}`);
    }
  }

  // 3. Gender preference check
  const needsUstadzah = shouldRecommendUstadzah(params.message);
  if (needsUstadzah) {
    suggestions.push("Audience muslimah — prioritaskan rekomendasi ustadzah");
  }

  return {
    passed: conflicts.length === 0,
    conflicts,
    suggestions,
  };
}

/** Get suggested alternative time slots avoiding prayer times */
export function suggestAlternativeTimes(day: string): string[] {
  return [
    "08:00 - 10:00 (sebelum Dzuhur)",
    "13:30 - 15:00 (setelah Salat Jumat / Dzuhur)",
    "16:00 - 17:45 (setelah Ashar, sebelum Maghrib)",
    "19:30 - 21:00 (setelah Isya)",
  ];
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

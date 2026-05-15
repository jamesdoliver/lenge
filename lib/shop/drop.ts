// Drop runs for 2 weeks starting 17:00 Berlin (CEST = UTC+2 in May) on 2026-05-15.
// Window: 2026-05-15 17:00 → 2026-05-29 17:00 Europe/Berlin.
export const DROP_START_MS = Date.parse("2026-05-15T17:00:00+02:00");
export const DROP_END_MS = Date.parse("2026-05-29T17:00:00+02:00");

export function isDropActive(now: number = Date.now()): boolean {
  return now < DROP_END_MS;
}

export function msUntilDropEnd(now: number = Date.now()): number {
  return Math.max(0, DROP_END_MS - now);
}

export type CountdownParts = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

export function splitCountdown(ms: number): CountdownParts {
  const totalSeconds = Math.floor(ms / 1000);
  return {
    days: Math.floor(totalSeconds / 86_400),
    hours: Math.floor((totalSeconds % 86_400) / 3_600),
    minutes: Math.floor((totalSeconds % 3_600) / 60),
    seconds: totalSeconds % 60,
  };
}

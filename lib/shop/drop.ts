// Midnight at end of May 22 Berlin (CEST = UTC+2 in May).
// Means: drop is live up to and including all of May 22; ends at 00:00 May 23.
export const DROP_END_MS = Date.parse("2026-05-23T00:00:00+02:00");

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

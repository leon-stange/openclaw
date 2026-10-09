import { createHash } from "node:crypto";
import { Type } from "typebox";

export const calendarReminderParameters = Type.Object({
  events: Type.Array(Type.Object({
    id: Type.String({ minLength: 1, maxLength: 2000 }),
    subject: Type.String({ maxLength: 500 }),
    start: Type.String({ minLength: 1, maxLength: 80 }),
    isAllDay: Type.Boolean(),
    isCancelled: Type.Boolean(),
    declined: Type.Boolean(),
  }, { additionalProperties: false }), { maxItems: 200 }),
}, { additionalProperties: false });

export type CalendarEvent = {
  id: string; subject: string; start: string;
  isAllDay: boolean; isCancelled: boolean; declined: boolean;
};
export type CalendarReminderState = { version: 1; attempts: { key: string; expiresAt: number }[] };

// The event occurrence AND its start define identity, including recurring events.
// Store hashes only; no calendar titles in the persistent suppression state.
export function planCalendarReminders(events: CalendarEvent[], state: CalendarReminderState, now = Date.now()) {
  if (!Number.isFinite(now) || state.version !== 1 || !Array.isArray(state.attempts) || state.attempts.length > 10000 ||
      state.attempts.some(a => !a || !/^[a-f0-9]{64}$/.test(a.key) || !Number.isFinite(a.expiresAt))) {
    throw new Error("Ungueltiger Termin-Erinnerungszustand; kein Versand.");
  }
  if (!Array.isArray(events) || events.length > 200) throw new Error("Ungueltige Kalenderdaten.");
  const attempts = state.attempts.filter(a => a.expiresAt > now);
  const known = new Set(attempts.map(a => a.key));
  const pending: { key: string; startMs: number; subject: string }[] = [];
  for (const e of events) {
    if (!e || typeof e.id !== "string" || !e.id.trim() || e.id.length > 2000 ||
        typeof e.subject !== "string" || e.subject.length > 500 || typeof e.start !== "string" ||
        e.start.length > 80 || !/(Z|[+-]\d{2}:\d{2})$/.test(e.start) || !Number.isFinite(Date.parse(e.start)) ||
        [e.isAllDay, e.isCancelled, e.declined].some(v => typeof v !== "boolean")) {
      throw new Error("Ungueltiger Termin oder Startzeit ohne Zeitzone; kein Versand.");
    }
    const startMs = Date.parse(e.start);
    if (e.isAllDay || e.isCancelled || e.declined || startMs <= now || startMs > now + 2 * 60 * 60 * 1000) continue;
    const key = createHash("sha256").update(JSON.stringify([e.id, new Date(startMs).toISOString()])).digest("hex");
    if (known.has(key)) continue;
    known.add(key);
    pending.push({ key, startMs, subject: e.subject.replace(/[\r\n\t]+/g, " ").trim() || "Termin ohne Titel" });
    attempts.push({ key, expiresAt: startMs + 7 * 24 * 60 * 60 * 1000 });
  }
  if (attempts.length > 10000) throw new Error("Termin-Erinnerungsspeicher voll; kein Versand.");
  pending.sort((a, b) => a.startMs - b.startMs || a.key.localeCompare(b.key));
  const format = new Intl.DateTimeFormat("de-DE", { timeZone: "Europe/Berlin", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  const text = pending.length ? "Hallo Leon, in den nächsten zwei Stunden " +
    (pending.length === 1 ? "beginnt dieser Termin:" : "beginnen diese Termine:") + "\n" +
    pending.map(e => `• ${format.format(e.startMs)} Uhr: ${e.subject}`).join("\n") : "";
  return { pending, text, state: { version: 1 as const, attempts } };
}

import type { AgendaEvent } from "../types/agenda";
import ICAL from "ical.js";

/** Bounded expansion, including VTIMEZONE, RRULE, EXDATE and RECURRENCE-ID.
 * Floating times follow the device zone (the upstream provides no zone).
 */
export function parseAgenda(
  raw: string,
  range?: { start: Date; end: Date },
): AgendaEvent[] {
  if (!raw.trimStart().startsWith("BEGIN:VCALENDAR"))
    throw new Error("Calendrier invalide.");
  const start = range?.start || new Date(new Date().getFullYear() - 1, 0, 1);
  const end = range?.end || new Date(new Date().getFullYear() + 2, 0, 1);
  // Definitions belong to this feed; a different agenda must not contaminate it.
  ICAL.TimezoneService.reset();
  const comp = new ICAL.Component(ICAL.parse(raw));
  const formatters = new Map<string, Intl.DateTimeFormat>();
  const toDate = (
    time: ICAL.Time,
    event: ICAL.Event,
    property: "dtstart" | "dtend",
  ) => {
    const tzid =
      event.component.getFirstProperty(property)?.getParameter("tzid") ??
      event.component.getFirstProperty("dtstart")?.getParameter("tzid");
    if (
      time.isDate ||
      time.zone.tzid !== "floating" ||
      typeof tzid !== "string"
    )
      return time.toJSDate();
    let formatter = formatters.get(tzid);
    try {
      if (!formatter) {
        formatter = new Intl.DateTimeFormat("en-GB", {
          timeZone: tzid,
          hourCycle: "h23",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });
        formatters.set(tzid, formatter);
      }
    } catch {
      throw new Error("Fuseau horaire du calendrier non pris en charge.");
    }
    const target = Date.UTC(
      time.year,
      time.month - 1,
      time.day,
      time.hour,
      time.minute,
      time.second,
    );
    let estimate = target;
    for (let i = 0; i < 4; i++) {
      const parts = Object.fromEntries(
        formatter
          .formatToParts(new Date(estimate))
          .map((p) => [p.type, p.value]),
      );
      const observed = Date.UTC(
        +parts.year,
        +parts.month - 1,
        +parts.day,
        +parts.hour,
        +parts.minute,
        +parts.second,
      );
      const next = target - (observed - estimate);
      if (next === estimate) return new Date(next);
      estimate = next;
    }
    throw new Error("Horaire local ambigu ou inexistant dans le calendrier.");
  };
  for (const tz of comp.getAllSubcomponents("vtimezone")) {
    const id = tz.getFirstPropertyValue("tzid");
    if (typeof id === "string")
      ICAL.TimezoneService.register(new ICAL.Timezone(tz), id);
  }
  const components = comp.getAllSubcomponents("vevent");
  const exceptions = new Map<string, ICAL.Event[]>();
  for (const c of components)
    if (c.hasProperty("recurrence-id")) {
      const e = new ICAL.Event(c);
      exceptions.set(e.uid, [...(exceptions.get(e.uid) || []), e]);
    }
  const result: AgendaEvent[] = [];
  const append = (
    event: ICAL.Event,
    from: ICAL.Time,
    to: ICAL.Time,
    recurrence: string,
  ) => {
    if (event.component.getFirstPropertyValue("status") === "CANCELLED") return;
    const s = toDate(from, event, "dtstart"),
      e = toDate(to, event, "dtend");
    if (
      !Number.isFinite(+s) ||
      !Number.isFinite(+e) ||
      e <= s ||
      e <= start ||
      s >= end
    )
      return;
    const title = (event.summary || "Sans titre")
      .replace(/\\n|\n/g, " ")
      .trim();
    result.push({
      id: `${event.uid || `${title}:${event.location}:${to.toString()}`}:${recurrence}`,
      title,
      location: (event.location || "Salle non précisée")
        .replace(/\\n|\n/g, " ")
        .trim(),
      start: s,
      end: e,
      professors: "",
      isExam: /EXAM|PARTIEL/i.test(title),
    });
  };
  for (const c of components) {
    if (c.hasProperty("recurrence-id")) continue;
    const event = new ICAL.Event(c, {
      exceptions: exceptions.get(String(c.getFirstPropertyValue("uid"))) || [],
    });
    if (!event.isRecurring()) {
      append(event, event.startDate, event.endDate, event.startDate.toString());
      continue;
    }
    const iterator = event.iterator();
    let time: ICAL.Time | null;
    let iterations = 0;
    while ((time = iterator.next())) {
      if (++iterations > 20000)
        throw new Error("Calendrier récurrent trop volumineux.");
      if (+toDate(time, event, "dtstart") >= +end) break;
      const occurrence = event.getOccurrenceDetails(time);
      append(
        occurrence.item,
        occurrence.startDate,
        occurrence.endDate,
        time.toString(),
      );
    }
  }
  return [...new Map(result.map((e) => [e.id, e])).values()].sort(
    (a, b) => +a.start - +b.start,
  );
}
export const formatTime = (d: Date) =>
  d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
export const formatFullDate = (d: Date) =>
  d.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
export function dayStart(d: Date) {
  const n = new Date(d);
  n.setHours(0, 0, 0, 0);
  return n;
}
export function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}
export function monday(d: Date) {
  return addDays(dayStart(d), -(d.getDay() + 6) % 7);
}
export const eventsOnDay = (events: AgendaEvent[], day: Date) =>
  events.filter(
    (e) => e.end > dayStart(day) && e.start < addDays(dayStart(day), 1),
  );
/** Interval partitioning with connected collision groups. Widths are stable within a group. */
export function layoutDay(events: AgendaEvent[], day: Date) {
  const start = dayStart(day),
    end = addDays(start, 1);
  const sorted = eventsOnDay(events, day)
    .map((event) => ({
      event,
      start: Math.max(+event.start, +start),
      end: Math.min(+event.end, +end),
      column: 0,
      columns: 1,
    }))
    .sort((a, b) => a.start - b.start || a.end - b.end);
  let group: typeof sorted = [],
    ends: number[] = [];
  const flush = () => {
    group.forEach((e) => {
      e.columns = ends.length;
    });
    group = [];
    ends = [];
  };
  for (const e of sorted) {
    if (group.length && e.start >= Math.max(...ends)) flush();
    let col = ends.findIndex((t) => t <= e.start);
    if (col < 0) col = ends.length;
    e.column = col;
    ends[col] = e.end;
    group.push(e);
  }
  flush();
  return sorted;
}

/** Local wall-clock position, unaffected by 23/25-hour DST days. */
export function minutesInDay(timestamp: number, day: Date) {
  if (timestamp <= +dayStart(day)) return 0;
  if (timestamp >= +addDays(dayStart(day), 1)) return 1440;
  const d = new Date(timestamp);
  return d.getHours() * 60 + d.getMinutes();
}

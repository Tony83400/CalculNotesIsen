import { it, expect } from "vitest";
import {
  parseAgenda,
  layoutDay,
  eventsOnDay,
  monday,
  minutesInDay,
} from "../utils/agenda";
import type { AgendaEvent } from "../types/agenda";
const calendar = (body: string) =>
  `BEGIN:VCALENDAR\r\nVERSION:2.0\r\n${body}\r\nEND:VCALENDAR`;
it("expands recurrence, exclusions and moved exceptions with stable ids", () => {
  const raw = calendar(
    `BEGIN:VEVENT\r\nUID:test\r\nDTSTART:20261020T080000Z\r\nDTEND:20261020T090000Z\r\nRRULE:FREQ=DAILY;COUNT=4\r\nEXDATE:20261021T080000Z\r\nSUMMARY:Fictif\r\nEND:VEVENT\r\nBEGIN:VEVENT\r\nUID:test\r\nRECURRENCE-ID:20261022T080000Z\r\nDTSTART:20261022T110000Z\r\nDTEND:20261022T120000Z\r\nSUMMARY:Déplacé\r\nEND:VEVENT`,
  );
  const range = {
    start: new Date("2026-10-19Z"),
    end: new Date("2026-10-25Z"),
  };
  const r = parseAgenda(raw, range);
  expect(r).toHaveLength(3);
  expect(r[1].start.toISOString()).toBe("2026-10-22T11:00:00.000Z");
  expect(new Set(r.map((e) => e.id)).size).toBe(3);
  expect(parseAgenda(raw, range).map((e) => e.id)).toEqual(r.map((e) => e.id));
});
it("respects timezone definitions across daylight saving", () => {
  const raw = calendar(
    `BEGIN:VTIMEZONE\r\nTZID:Europe/Paris\r\nBEGIN:STANDARD\r\nDTSTART:19701025T030000\r\nRRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU\r\nTZOFFSETFROM:+0200\r\nTZOFFSETTO:+0100\r\nEND:STANDARD\r\nBEGIN:DAYLIGHT\r\nDTSTART:19700329T020000\r\nRRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU\r\nTZOFFSETFROM:+0100\r\nTZOFFSETTO:+0200\r\nEND:DAYLIGHT\r\nEND:VTIMEZONE\r\nBEGIN:VEVENT\r\nUID:dst\r\nDTSTART;TZID=Europe/Paris:20261024T090000\r\nDTEND;TZID=Europe/Paris:20261024T100000\r\nRRULE:FREQ=DAILY;COUNT=3\r\nSUMMARY:Test\r\nEND:VEVENT`,
  );
  const r = parseAgenda(raw, {
    start: new Date("2026-10-23Z"),
    end: new Date("2026-10-28Z"),
  });
  expect(r.map((e) => e.start.getUTCHours())).toEqual([7, 8, 8]);
});
it("rejects malformed input and ignores cancelled events", () => {
  expect(() => parseAgenda("<html>error</html>")).toThrow();
  expect(
    parseAgenda(
      calendar(
        "BEGIN:VEVENT\r\nUID:x\r\nDTSTART:20261104T080000Z\r\nDTEND:20261104T090000Z\r\nSTATUS:CANCELLED\r\nEND:VEVENT",
      ),
    ),
  ).toHaveLength(0);
});
it("clips multi-day events and partitions chained collisions", () => {
  const day = new Date(2026, 10, 4);
  const event = (id: string, start: number, end: number): AgendaEvent => ({
    id,
    title: id,
    location: "Fictif",
    professors: "",
    start: new Date(+day + start * 3600000),
    end: new Date(+day + end * 3600000),
  });
  const e = [
    event("a", 8, 10),
    event("b", 9, 11),
    event("c", 10, 12),
    event("long", -2, 1),
  ];
  expect(eventsOnDay(e, day)).toHaveLength(4);
  const layout = layoutDay(e, day);
  expect(layout.find((p) => p.event.id === "long")?.start).toBe(+day);
  expect(
    layout.filter((p) => p.event.id !== "long").map((p) => p.columns),
  ).toEqual([2, 2, 2]);
  expect(monday(new Date(2026, 10, 8)).getDate()).toBe(2);
});

it("interprets IANA TZID without VTIMEZONE independently of the device timezone", () => {
  const raw = calendar(
    "BEGIN:VEVENT\r\nUID:iana\r\nDTSTART;TZID=Europe/Paris:20261024T090000\r\nDTEND;TZID=Europe/Paris:20261024T100000\r\nRRULE:FREQ=DAILY;COUNT=3\r\nSUMMARY:Fictif\r\nEND:VEVENT",
  );
  expect(
    parseAgenda(raw, {
      start: new Date("2026-10-23Z"),
      end: new Date("2026-10-28Z"),
    }).map((e) => e.start.getUTCHours()),
  ).toEqual([7, 8, 8]);
});
it("places courses by local wall time on daylight-saving transition days", () => {
  const day = new Date(2026, 9, 25);
  expect(minutesInDay(+new Date(2026, 9, 25, 9, 30), day)).toBe(570);
  expect(minutesInDay(+new Date(2026, 9, 26), day)).toBe(1440);
});

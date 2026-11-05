import React, { act } from "react";
import { create, type ReactTestRenderer } from "react-test-renderer";
import { beforeEach, expect, it, vi } from "vitest";
import { useCalendarNavigation } from "../hooks/useCalendarNavigation";
const screen = vi.hoisted(() => ({ width: 390, height: 844 }));
vi.mock("react-native", () => ({ useWindowDimensions: () => screen }));
let calendar: ReturnType<typeof useCalendarNavigation>;
function Probe({ shared = false }: { shared?: boolean }) {
  calendar = useCalendarNavigation({ allowWeekOnMobile: shared });
  return null;
}
async function mount(shared: boolean) {
  let view: ReactTestRenderer;
  await act(async () => {
    view = create(<Probe shared={shared} />);
  });
  return view!;
}
beforeEach(() => {
  screen.width = 390;
});
it("lets a phone choose the whole shared week and return to the same selected day", async () => {
  const view = await mount(true);
  const date = +calendar.selectedDate;
  expect(calendar.viewMode).toBe("day");
  await act(async () => calendar.setViewMode("week"));
  expect(calendar.viewMode).toBe("week");
  expect(calendar.currentDay.getDay()).toBe(1);
  expect(calendar.endOfWeek.getDay()).toBe(0);
  await act(async () => calendar.setViewMode("day"));
  expect(+calendar.selectedDate).toBe(date);
  await act(async () => view.unmount());
});
it("moves by seven days in week mode, then by one day in day mode", async () => {
  const view = await mount(true);
  await act(async () => calendar.setViewMode("week"));
  const week = new Date(calendar.currentDay);
  week.setDate(week.getDate() + 7);
  await act(async () => calendar.changeDate(7));
  expect(+calendar.currentDay).toBe(+week);
  await act(async () => calendar.setViewMode("day"));
  const day = new Date(calendar.selectedDate);
  day.setDate(day.getDate() + 1);
  await act(async () => calendar.changeDate(1));
  expect(+calendar.selectedDate).toBe(+day);
  await act(async () => view.unmount());
});
it("keeps the explicitly selected shared week when resizing to a phone", async () => {
  screen.width = 1440;
  const view = await mount(true);
  expect(calendar.viewMode).toBe("week");
  await act(async () => calendar.setViewMode("week"));
  await act(async () => {
    screen.width = 390;
    view.update(<Probe shared />);
  });
  expect(calendar.viewMode).toBe("week");
  await act(async () => view.unmount());
});
it("preserves the personal mobile day view", async () => {
  const view = await mount(false);
  await act(async () => calendar.setViewMode("week"));
  expect(calendar.viewMode).toBe("day");
  await act(async () => view.unmount());
});

import { setColorMode } from "../constants/Colors";
import React, { act } from "react";
import { create, type ReactTestRenderer } from "react-test-renderer";
import { expect, it, vi } from "vitest";
import AgendaGrid from "../components/ui/agenda/AgendaGrid";
import type { AgendaEvent } from "../types/agenda";
vi.mock("react-native", () => ({
  View: "View",
  Text: "Text",
  ScrollView: "ScrollView",
  Pressable: "Pressable",
  StyleSheet: { create: (s: unknown) => s },
}));
vi.mock("../components/ui/Primitives", () => ({
  ui: { panel: {}, small: {} },
}));
vi.mock("../components/ui/agenda/EventDetailModal", () => ({
  default: "EventModal",
}));
const monday = new Date(2026, 10, 2);
function course(
  id: string,
  day: number,
  start: number,
  end: number,
  owner: string,
): AgendaEvent {
  const from = new Date(monday),
    to = new Date(monday);
  from.setDate(from.getDate() + day);
  to.setDate(to.getDate() + day);
  from.setHours(start);
  to.setHours(end);
  return {
    id,
    title: `Cours fictif ${id}`,
    start: from,
    end: to,
    location: "Salle fictive",
    professors: "",
    userName: owner,
    color: "#26264C",
  };
}
const events = [
  course("a", 0, 8, 12, "Camille Exemple"),
  course("b", 0, 8, 12, "Alex Fictif"),
  course("c", 0, 13, 17, "Camille Exemple"),
  course("d", 0, 14, 18, "Alex Fictif"),
];
const flatten = (s: Record<string, unknown>[]) => Object.assign({}, ...s);
async function render(mode: "day" | "week", data = events) {
  let view: ReactTestRenderer;
  await act(async () => {
    view = create(
      <AgendaGrid
        events={data}
        startDay={monday}
        viewMode={mode}
        hideDetails
      />,
    );
  });
  return view!;
}
it("aligns simultaneous courses side by side in the shared day timeline", async () => {
  const view = await render("day");
  expect(
    view.root.findAllByProps({ testID: "agenda-day-header" }),
  ).toHaveLength(1);
  const style = (id: string) =>
    flatten(
      view.root.findByProps({ testID: `agenda-event-${id}` }).props.style,
    );
  const a = style("a"),
    b = style("b"),
    c = style("c"),
    d = style("d");
  expect(a.top).toBe(b.top);
  expect(a.height).toBe(b.height);
  expect(a.left).not.toBe(b.left);
  expect(a.width).toBe(b.width);
  expect(Number(a.left) + Number(a.width)).toBeLessThanOrEqual(Number(b.left));
  expect(c.top).toBeGreaterThan(a.top);
  expect(d.top).toBeGreaterThan(c.top);
  expect(c.height).toBe(d.height);
  await act(async () => view.unmount());
});
it("shows the entire Monday-to-Sunday week and excludes the next Monday", async () => {
  const view = await render("week", [
    ...events,
    course("sunday", 6, 9, 11, "Camille Exemple"),
    course("next-week", 7, 9, 11, "Alex Fictif"),
  ]);
  const headers = view.root.findAllByProps({ testID: "agenda-day-header" });
  expect(headers).toHaveLength(7);
  expect(headers[0].props.accessibilityLabel).toContain("lundi");
  expect(headers[6].props.accessibilityLabel).toContain("dimanche");
  expect(
    view.root.findAllByProps({ testID: "agenda-event-sunday" }),
  ).toHaveLength(1);
  expect(
    view.root.findAllByProps({ testID: "agenda-event-next-week" }),
  ).toHaveLength(0);
  await act(async () => view.unmount());
});
it("keeps day filtering and the basic shared-course detail boundary", async () => {
  const view = await render("day", [
    ...events,
    course("tomorrow", 1, 8, 12, "Alex Fictif"),
  ]);
  expect(
    view.root.findAllByProps({ testID: "agenda-event-tomorrow" }),
  ).toHaveLength(0);
  await act(async () =>
    view.root.findByProps({ testID: "agenda-event-b" }).props.onPress(),
  );
  const modal = view.root.findByType("EventModal" as React.ElementType);
  expect(modal.props.visible).toBe(true);
  expect(modal.props.hideDetails).toBe(true);
  expect(modal.props.event.userName).toBe("Alex Fictif");
  await act(async () => view.unmount());
});
it("uses the real container width and scrolls internally for many concurrent courses", async () => {
  const view = await render("day", [
    ...events,
    course("third", 0, 8, 12, "Morgan Test"),
  ]);
  const grid = view.root.findByProps({ testID: "agenda-time-grid" });
  await act(async () =>
    grid.props.onLayout({ nativeEvent: { layout: { width: 350 } } }),
  );
  const scroll = view.root.findByType("ScrollView" as React.ElementType);
  expect(scroll.props.horizontal).toBe(true);
  expect(scroll.props.contentContainerStyle.width).toBeGreaterThan(350);
  await act(async () =>
    grid.props.onLayout({ nativeEvent: { layout: { width: 1200 } } }),
  );
  expect(scroll.props.contentContainerStyle.width).toBe(1200);
  await act(async () => view.unmount());
});

it("fits all seven shared days inside the measured container without horizontal scrolling", async () => {
  const view = await render("week");
  await act(async () =>
    view.root
      .findByProps({ testID: "agenda-time-grid" })
      .props.onLayout({ nativeEvent: { layout: { width: 390 } } }),
  );
  const scroll = view.root.findByType("ScrollView" as React.ElementType);
  expect(scroll.props.scrollEnabled).toBe(false);
  expect(scroll.props.contentContainerStyle.width).toBe(388);
  expect(
    view.root.findAllByProps({ testID: "agenda-day-header" }),
  ).toHaveLength(7);
  await act(async () => view.unmount());
});

it("keeps shared blue courses visible against the dark calendar", async () => {
  setColorMode("dark");
  try {
    const view = await render("day");
    const style = flatten(
      view.root.findByProps({ testID: "agenda-event-a" }).props.style,
    );
    expect(style.backgroundColor).toBe("#C6E3FF");
    expect(style.borderLeftColor).toBe("#5299DC");
    await act(async () => view.unmount());
  } finally {
    setColorMode("light");
  }
});

it("uses distinct light identities for two people even in dark mode", async () => {
  setColorMode("dark");
  try {
    const view = await render(
      "day",
      events.map((e, i) => ({ ...e, color: i === 1 ? "#B2343D" : e.color })),
    );
    const a = flatten(
      view.root.findByProps({ testID: "agenda-event-a" }).props.style,
    );
    const b = flatten(
      view.root.findByProps({ testID: "agenda-event-b" }).props.style,
    );
    expect(a.backgroundColor).toBe("#C6E3FF");
    expect(b.backgroundColor).toBe("#FFD4DE");
    expect(a.borderLeftColor).not.toBe(b.borderLeftColor);
    await act(async () => view.unmount());
  } finally {
    setColorMode("light");
  }
});

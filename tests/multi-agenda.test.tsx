import React, { act } from "react";
import { create, type ReactTestRenderer } from "react-test-renderer";
import { beforeEach, it, expect, vi } from "vitest";
import { useMultiAgenda } from "../hooks/useMultiAgenda";
import { fetchCalendar } from "../services/agendaApi";
vi.mock("../providers/AppData", () => ({
  useAppData: () => account,
}));
vi.mock("../services/agendaApi", () => ({ fetchCalendar: vi.fn() }));
const store = new Map<string, string>();
vi.mock("../services/storage/base", () => ({
  getStorageItem: async (k: string) => store.get(k) || null,
  setStorageItem: async (k: string, v: string) => {
    store.set(k, v);
  },
}));
const account = vi.hoisted(() => ({
  user: "fiction.owner",
  demo: false,
  generation: 1,
}));
let hook: ReturnType<typeof useMultiAgenda>;
const Event = (id: string) => ({
  id,
  title: "Fictif",
  location: "Salle fictive",
  professors: "",
  start: new Date(2026, 10, 4, 8),
  end: new Date(2026, 10, 4, 9),
});
function Probe() {
  hook = useMultiAgenda();
  return null;
}
async function mount() {
  let renderer: ReactTestRenderer;
  await act(async () => {
    renderer = create(<Probe />);
  });
  return renderer!;
}
beforeEach(() => {
  store.clear();
  account.user = "fiction.owner";
  account.generation = 1;
  vi.mocked(fetchCalendar).mockReset();
});
it("really refetches on refresh and keeps other agendas after one failure", async () => {
  vi.mocked(fetchCalendar).mockImplementation(async (p) => [Event(p)]);
  const renderer = await mount();
  await act(async () => {
    await hook.addUser("Fiction", "Alice");
  });
  expect(fetchCalendar).toHaveBeenCalledTimes(1);
  await act(async () => {
    hook.refresh();
  });
  expect(fetchCalendar).toHaveBeenCalledTimes(2);
  await act(async () => {
    await hook.addUser("Fiction", "Bob");
  });
  vi.mocked(fetchCalendar).mockImplementation(async (_p, n) => {
    if (n === "alice") throw new Error("Unavailable");
    return [Event("updated-bob")];
  });
  await act(async () => {
    hook.refresh();
  });
  expect(hook.errors["fiction.alice"]).toBe("Unavailable");
  expect(hook.allEvents.some((e) => e.id.includes("updated-bob"))).toBe(true);
  expect(hook.users).toHaveLength(2);
  await act(async () => renderer.unmount());
});
it("does not restore a removed agenda when an old request finishes", async () => {
  let resolve: (v: ReturnType<typeof Event>[]) => void = () => {};
  vi.mocked(fetchCalendar).mockImplementation(
    () =>
      new Promise((r) => {
        resolve = r;
      }),
  );
  const renderer = await mount();
  await act(async () => {
    await hook.addUser("Fiction", "Alice");
  });
  await act(async () => {
    hook.removeUser("fiction.alice");
  });
  await act(async () => {
    resolve([Event("late")]);
  });
  expect(hook.allEvents).toEqual([]);
  expect(hook.users).toEqual([]);
  await act(async () => renderer.unmount());
});
it("prevents duplicate adds even in the same event batch", async () => {
  vi.mocked(fetchCalendar).mockResolvedValue([]);
  const renderer = await mount();
  await act(async () => {
    await Promise.all([
      hook.addUser("Fiction", "Alice"),
      hook.addUser("Fiction", "Alice"),
    ]);
  });
  expect(hook.users).toHaveLength(1);
  expect(fetchCalendar).toHaveBeenCalledTimes(1);
  await act(async () => renderer.unmount());
});

it("clears visible comparisons and never persists the previous account into the next account", async () => {
  vi.mocked(fetchCalendar).mockResolvedValue([Event("old")]);
  const renderer = await mount();
  await act(async () => {
    await hook.addUser("Fiction", "Alice");
  });
  expect(hook.users).toHaveLength(1);
  await act(async () => {
    account.user = "fiction.new";
    account.generation++;
    renderer.update(<Probe />);
  });
  expect(hook.users).toEqual([]);
  expect(hook.allEvents).toEqual([]);
  expect(
    JSON.parse(store.get("Multi:fiction.new") || '{"users":[]}').users,
  ).toEqual([]);
  await act(async () => renderer.unmount());
});

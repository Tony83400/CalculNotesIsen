import React, { act } from "react";
import { create, type ReactTestRenderer } from "react-test-renderer";
import { beforeEach, it, expect, vi } from "vitest";
import { AppDataProvider, useAppData } from "../providers/AppData";
import * as storage from "../services/storage";
import { getNotes, login } from "../services/isenApi";
import { getAgendaFor } from "../services/agendaApi";
import { invalidateDataScope } from "../services/dataScope";
vi.mock("../services/isenApi", () => ({
  getNotes: vi.fn(),
  login: vi.fn(async () => ({ token: "fiction-token" })),
}));
vi.mock("../services/agendaApi", () => ({
  getAgendaFor: vi.fn(async () => []),
}));
vi.mock("../services/configApi", () => ({
  fetchSemesterStructure: vi.fn(async () => [
    {
      ue: "Fictif",
      ects: 3,
      matieres: [
        {
          name: "A",
          coeff_matiere: 1,
          evaluations: [{ name: "A", code: "a", coeff: 1 }],
        },
      ],
    },
  ]),
}));
let app: ReturnType<typeof useAppData>;
const seen: string[] = [];
function Probe() {
  app = useAppData();
  seen.push(`${app.user}:${app.notes.data.map((n) => n.code).join(",")}`);
  return null;
}
async function mount() {
  let renderer: ReactTestRenderer;
  await act(async () => {
    renderer = create(
      <AppDataProvider>
        <Probe />
      </AppDataProvider>,
    );
  });
  return renderer!;
}
async function configure(id: string) {
  await storage.setId(id);
  await storage.setToken("fiction");
  await storage.setSelectedYear("M1");
  await storage.setSelectedSemester("S7");
  await storage.setSelectedMajors({ S7: "Fictif" });
  await storage.setSelectedMajorsUrls({ S7: "fiction-url" });
}
beforeEach(async () => {
  await storage.clearAllStorage();
  vi.mocked(getNotes).mockReset();
  vi.mocked(getAgendaFor).mockClear();
  seen.length = 0;
});
it("never exposes the previous account while switching or after late completion", async () => {
  await configure("fiction.alice");
  let finish: (
    n: { code: string; name: string; note: number; date: string }[],
  ) => void = () => {};
  vi.mocked(getNotes)
    .mockImplementationOnce(
      () =>
        new Promise((r) => {
          finish = r;
        }),
    )
    .mockResolvedValue([{ code: "bob", name: "Fictif", note: 12, date: "" }]);
  const renderer = await mount();
  await act(async () => {
    await app.authenticate("fiction.bob", "fictitious", false);
  });
  await act(async () => {
    finish([{ code: "alice", name: "Fictif", note: 18, date: "" }]);
  });
  expect(app.user).toBe("fiction.bob");
  expect(app.notes.data.map((n) => n.code)).toEqual(["bob"]);
  expect(seen.some((x) => x === "fiction.bob:alice")).toBe(false);
  expect(await storage.readCache("notes", "fiction.alice")).toBeNull();
  expect(login).toHaveBeenCalled();
  await act(async () => renderer.unmount());
});
it("labels network failure with a successful old cache as cache, never network", async () => {
  await configure("fiction.alice");
  await storage.writeCache("notes", "fiction.alice", [
    { code: "cache", name: "Fictif", note: 12, date: "" },
  ]);
  vi.mocked(getNotes).mockRejectedValue(new Error("Offline"));
  const renderer = await mount();
  expect(app.notes.status).toBe("cache");
  expect(app.notes.error).toBe("Offline");
  expect(app.notes.data[0].code).toBe("cache");
  await act(async () => renderer.unmount());
});
it("invalidates simulations and all projected data on logout", async () => {
  vi.mocked(getNotes).mockResolvedValue([]);
  const renderer = await mount();
  await act(async () => {
    await app.startDemo();
  });
  await act(async () => {
    app.updateSimulation("fiction", 16);
  });
  expect(app.simulations.fiction).toBe(16);
  await act(async () => {
    await app.logout();
  });
  expect(app.user).toBeNull();
  expect(app.notes.data).toEqual([]);
  expect(app.agenda.data).toEqual([]);
  expect(app.simulations).toEqual({});
  await act(async () => renderer.unmount());
});
it("drops simulations and reloads configuration after a curriculum generation change", async () => {
  vi.mocked(getNotes).mockResolvedValue([]);
  const renderer = await mount();
  await act(async () => {
    await app.startDemo();
  });
  await act(async () => {
    app.updateSimulation("fiction", 12);
  });
  await act(async () => {
    invalidateDataScope();
  });
  expect(app.simulations).toEqual({});
  await act(async () => renderer.unmount());
});

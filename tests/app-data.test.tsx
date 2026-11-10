import React, { act } from "react";
import { create, type ReactTestRenderer } from "react-test-renderer";
import { beforeEach, it, expect, vi } from "vitest";
import { AppDataProvider, useAppData } from "../providers/AppData";
import * as storage from "../services/storage";
import { getNotes, login } from "../services/isenApi";
import { getAgendaFor } from "../services/agendaApi";
import { invalidateDataScope } from "../services/dataScope";
import { restoreWebSession, clearWebSession } from "../services/webSession";

vi.mock("../services/webSession", () => ({
  restoreWebSession: vi.fn(async () => null),
  clearWebSession: vi.fn(async () => {}),
}));
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
async function configure(user: string) {
  await storage.setId(user);
  await storage.setToken("tok");
  await storage.setSelectedYear("ISEN4");
  await storage.setSelectedSemester("S7");
  await storage.setSelectedMajors({ S7: "DEV_LOGICIEL" });
  await storage.setSelectedMajorsUrls({ S7: "https://example.com/S7.json" });
}

beforeEach(async () => {
  seen.length = 0;
  localStorage.clear();
  invalidateDataScope();
  vi.clearAllMocks();
});

it("loads stored identity and cached data synchronously, ignoring network responses after user change", async () => {
  await configure("fiction.camille");
  await storage.writeCache("notes", "fiction.camille", [
    { code: "camille", name: "Fictif", note: 15, date: "" },
  ]);
  let resolveCamille: (n: unknown) => void = () => {};
  vi.mocked(getNotes).mockImplementationOnce(
    () =>
      new Promise((r) => {
        resolveCamille = r;
      }),
  );
  const renderer = await mount();
  expect(app.user).toBe("fiction.camille");
  expect(app.notes.data[0].code).toBe("camille");

  await act(async () => {
    await app.authenticate("fiction.alex", "secret", false);
  });
  await act(async () => {
    resolveCamille([{ code: "late-camille", name: "Fictif", note: 10, date: "" }]);
  });
  expect(app.user).toBe("fiction.alex");
  expect(app.notes.data.some((n) => n.code.includes("camille"))).toBe(false);
  await act(async () => renderer.unmount());
});

it("keeps and labels cached data when network fails, showing the network error", async () => {
  await configure("fiction.camille");
  await storage.writeCache("notes", "fiction.camille", [
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
  await configure("fiction.camille");
  vi.mocked(getNotes).mockResolvedValue([]);
  const renderer = await mount();
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
  expect(clearWebSession).toHaveBeenCalled();
  await act(async () => renderer.unmount());
});

it("drops simulations and reloads configuration after a curriculum generation change", async () => {
  await configure("fiction.camille");
  vi.mocked(getNotes).mockResolvedValue([]);
  const renderer = await mount();
  await act(async () => {
    app.updateSimulation("fiction", 12);
  });
  await act(async () => {
    invalidateDataScope();
  });
  expect(app.simulations).toEqual({});
  await act(async () => renderer.unmount());
});

it("restores a remembered account at startup before loading its account-scoped data", async () => {
  vi.mocked(restoreWebSession).mockResolvedValueOnce({
    username: "fiction.camille",
    token: "fiction-token",
  });
  vi.mocked(getNotes).mockResolvedValue([
    { code: "restored", name: "Fictif", note: 14, date: "" },
  ]);
  const renderer = await mount();
  expect(app.user).toBe("fiction.camille");
  expect(app.notes.data[0].code).toBe("restored");
  expect(await storage.getPasswordStorage()).toBeNull();
  expect(localStorage.getItem("Password")).toBeNull();
  await act(async () => renderer.unmount());
});

it("does not reinstate a session when a delayed startup restoration finishes after logout", async () => {
  let finish: (data: { username: string; token: string }) => void = () => {};
  vi.mocked(restoreWebSession).mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const renderer = await mount();
  await act(async () => app.logout());
  await act(async () =>
    finish({ username: "fiction.old", token: "old-token" }),
  );
  expect(app.user).toBeNull();
  expect(await storage.getToken()).toBeNull();
  expect(app.notes.data).toEqual([]);
  await act(async () => renderer.unmount());
});

it("shows a logout failure instead of claiming the remembered session was removed", async () => {
  await configure("fiction.camille");
  vi.mocked(getNotes).mockResolvedValue([]);
  const renderer = await mount();
  vi.mocked(clearWebSession).mockRejectedValueOnce(
    new Error("Offline and storage blocked"),
  );
  await act(async () => {
    expect(await app.logout()).toBe(false);
  });
  expect(app.sessionError).toContain("déconnexion");
  expect(app.user).toBe("fiction.camille");
  await act(async () => renderer.unmount());
});

import { it, expect, vi, afterEach } from "vitest";
import {
  getNotes,
  getEventIdByTime,
  getEventDetails,
} from "../services/isenApi";
import { restoreWebSession } from "../services/webSession";
import { setToken } from "../services/storage";
vi.mock("../services/webSession", () => ({
  restoreWebSession: vi.fn(async () => null),
}));
vi.mock("../services/storage", () => ({
  getToken: async () => "fiction-token",
  isTokenExpired: async () => false,
  getId: async () => "fiction.alice",
  getPasswordStorage: async () => null,
  setToken: vi.fn(),
}));
afterEach(() => vi.restoreAllMocks());
it("renews a remembered web session once after a 401 and keeps the new token in memory", async () => {
  vi.mocked(restoreWebSession).mockResolvedValueOnce({
    username: "fiction.alice",
    token: "new-fiction-token",
  });
  const fetch = vi
    .spyOn(globalThis, "fetch")
    .mockResolvedValueOnce(new Response("{}", { status: 401 }))
    .mockResolvedValueOnce(new Response("[]"));
  expect(await getNotes()).toEqual([]);
  expect(fetch).toHaveBeenCalledTimes(2);
  expect(setToken).toHaveBeenCalledWith(
    "new-fiction-token",
    expect.any(Number),
  );
});
it("does not loop on repeated 401 even when a remembered login succeeds", async () => {
  vi.mocked(restoreWebSession).mockResolvedValueOnce({
    username: "fiction.alice",
    token: "new-fiction-token",
  });
  const fetch = vi
    .spyOn(globalThis, "fetch")
    .mockImplementation(async () => new Response("{}", { status: 401 }));
  await expect(getNotes()).rejects.toThrow("Session expirée");
  expect(fetch).toHaveBeenCalledTimes(2);
});
it("does not use another account's remembered session to refresh current personal data", async () => {
  vi.mocked(restoreWebSession).mockResolvedValueOnce({
    username: "fiction.bob",
    token: "other-fiction-token",
  });
  const fetch = vi
    .spyOn(globalThis, "fetch")
    .mockResolvedValue(new Response("{}", { status: 401 }));
  await expect(getNotes()).rejects.toThrow("Session expirée");
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(setToken).not.toHaveBeenCalledWith(
    "other-fiction-token",
    expect.anything(),
  );
});
it("does not invent zero for absent grades or retain NaN from the API", async () => {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(
      JSON.stringify([
        { code: "a", name: "A", note: null },
        { code: "b", name: "B", note: "12,125" },
        { code: "c", name: "C", note: "abc" },
      ]),
      { status: 200 },
    ),
  );
  expect(await getNotes()).toEqual([
    { code: "b", name: "B", note: 12.125, date: "" },
  ]);
});
it("expires a web session on 401 without recursive fetches", async () => {
  const fetch = vi
    .spyOn(globalThis, "fetch")
    .mockResolvedValue(new Response("{}", { status: 401 }));
  await expect(getNotes()).rejects.toThrow("Session expirée");
  expect(fetch).toHaveBeenCalledTimes(1);
});
it("matches exact intervals and declines ambiguous or merely nearby courses", async () => {
  const start = Date.UTC(2026, 10, 4, 8),
    end = start + 3600000;
  const fetch = vi.spyOn(globalThis, "fetch");
  fetch.mockResolvedValueOnce(
    new Response(
      JSON.stringify([
        { id: 42, start: new Date(start), end: new Date(end) },
        {
          id: 43,
          start: new Date(start + 180000),
          end: new Date(end + 180000),
        },
      ]),
    ),
  );
  expect(await getEventIdByTime(start, end)).toBe("42");
  fetch.mockResolvedValueOnce(
    new Response(
      JSON.stringify([
        { id: "a", start: new Date(start), end: new Date(end) },
        { id: "b", start: new Date(start), end: new Date(end) },
      ]),
    ),
  );
  expect(await getEventIdByTime(start, end)).toBeNull();
});
it("validates personal course details before rendering list fields", async () => {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(
      JSON.stringify({
        start: "2026-11-04T08:00:00Z",
        end: "2026-11-04T09:00:00Z",
        teachers: "bad",
        groups: [1, "Groupe fictif"],
        students: null,
      }),
    ),
  );
  const result = await getEventDetails("fiction");
  expect(result?.teachers).toEqual([]);
  expect(result?.groups).toEqual(["Groupe fictif"]);
});

it("matches a unique course when the summary omits the end but rejects ambiguity", async () => {
  const start = Date.UTC(2026, 10, 4, 8),
    end = start + 3600000;
  const fetch = vi.spyOn(globalThis, "fetch");
  fetch.mockResolvedValueOnce(
    new Response(JSON.stringify([{ id: "fiction", start: start / 1000 }])),
  );
  expect(await getEventIdByTime(start, end)).toBe("fiction");
  fetch.mockResolvedValueOnce(
    new Response(
      JSON.stringify([
        { id: "a", start },
        { id: "b", start },
      ]),
    ),
  );
  await expect(getEventIdByTime(start, end)).rejects.toThrow("Plusieurs cours");
  fetch.mockResolvedValueOnce(
    new Response(JSON.stringify([{ id: "a", start, end: end + 3600000 }])),
  );
  expect(await getEventIdByTime(start, end)).toBeNull();
});
it("accepts course details without redundant timestamps, retaining validated student lists", async () => {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(
      JSON.stringify({
        students: ["Étudiant fictif", 42],
        teachers: ["Prof fictif"],
        subject: "Cours fictif",
      }),
    ),
  );
  const details = await getEventDetails("fiction");
  expect(details?.students).toEqual(["Étudiant fictif"]);
  expect(details?.start).toBe("");
});
it("reports unexpected API contracts instead of disguising them as a missing course", async () => {
  const fetch = vi.spyOn(globalThis, "fetch");
  fetch.mockResolvedValueOnce(new Response(JSON.stringify({ unexpected: [] })));
  await expect(getEventIdByTime(1, 2)).rejects.toThrow("format");
  fetch.mockResolvedValueOnce(
    new Response(JSON.stringify({ unexpected: true })),
  );
  await expect(getEventDetails("fiction")).rejects.toThrow("format");
});

import { beforeEach, afterEach, expect, it, vi } from "vitest";
import {
  loginWeb,
  restoreWebSession,
  clearWebSession,
} from "../services/webSession";
import { clearAllStorage } from "../services/storage";
const session = { username: "fiction.camille", token: "fiction-token" };
const payload = {
  username: session.username,
  password: "fictitious",
  remember: true,
};
beforeEach(() => {
  localStorage.clear();
});
afterEach(() => vi.restoreAllMocks());
it("submits the choice to the server with same-origin credentials without writing secrets to storage", async () => {
  const fetch = vi
    .spyOn(globalThis, "fetch")
    .mockResolvedValue(new Response(JSON.stringify(session)));
  expect(await loginWeb(payload)).toEqual(session);
  expect(fetch).toHaveBeenCalledWith(
    "/api/session",
    expect.objectContaining({
      method: "POST",
      credentials: "same-origin",
      cache: "no-store",
      body: JSON.stringify(payload),
    }),
  );
  expect(localStorage.length).toBe(0);
});
it("coalesces simultaneous restoration, uses only the HttpOnly cookie and treats absent/expired sessions as signed out", async () => {
  const fetch = vi
    .spyOn(globalThis, "fetch")
    .mockImplementation(async () => new Response(JSON.stringify(session)));
  expect(await Promise.all([restoreWebSession(), restoreWebSession()])).toEqual(
    [session, session],
  );
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(fetch.mock.calls[0][1]?.body).toBeUndefined();
  fetch.mockResolvedValueOnce(new Response(null, { status: 204 }));
  expect(await restoreWebSession()).toBeNull();
  fetch.mockResolvedValueOnce(new Response("{}", { status: 401 }));
  expect(await restoreWebSession()).toBeNull();
});
it("reports server configuration failures and validates session responses", async () => {
  const fetch = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
    new Response(JSON.stringify({ error: "Clé serveur absente" }), {
      status: 503,
    }),
  );
  await expect(loginWeb(payload)).rejects.toThrow("Clé serveur absente");
  fetch.mockResolvedValueOnce(
    new Response(JSON.stringify({ username: session.username })),
  );
  await expect(restoreWebSession()).rejects.toThrow(
    "Réponse de connexion invalide",
  );
});
it("orders logout after an in-flight login so its late cookie cannot reinstate the session", async () => {
  let finish: (r: Response) => void = () => {};
  const fetch = vi
    .spyOn(globalThis, "fetch")
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    )
    .mockResolvedValueOnce(new Response(null, { status: 204 }));
  const login = loginWeb(payload);
  await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
  const logout = clearWebSession();
  expect(fetch).toHaveBeenCalledTimes(1);
  finish(new Response(JSON.stringify(session)));
  await Promise.all([login, logout]);
  expect(fetch.mock.calls.map((c) => c[1]?.method)).toEqual(["POST", "DELETE"]);
  expect(localStorage.getItem("cnisen:logout-pending")).toBeNull();
});
it("keeps offline logout after clearing cached data and retries deletion before any restore", async () => {
  const fetch = vi
    .spyOn(globalThis, "fetch")
    .mockRejectedValueOnce(new Error("Offline"));
  await clearWebSession();
  await clearAllStorage();
  expect(localStorage.getItem("cnisen:logout-pending")).toBe("1");
  fetch.mockResolvedValueOnce(new Response(null, { status: 204 }));
  expect(await restoreWebSession()).toBeNull();
  expect(fetch.mock.calls.map((c) => c[1]?.method)).toEqual([
    "DELETE",
    "DELETE",
  ]);
  expect(localStorage.getItem("cnisen:logout-pending")).toBeNull();
});
it("reports a failed logout when both the network and local storage are unavailable", async () => {
  vi.spyOn(localStorage, "setItem").mockImplementation(() => {
    throw new Error("Storage blocked");
  });
  vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Offline"));
  await expect(clearWebSession()).rejects.toThrow("Offline");
});

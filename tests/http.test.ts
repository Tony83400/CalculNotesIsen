import { it, expect, vi } from "vitest";
import { createAuthorizedRequest, timedFetch } from "../services/http";
const response = (status: number) => new Response("{}", { status });
it("bounds repeated 401 responses to one renewal and two resource calls", async () => {
  const renew = vi.fn(async () => "new"),
    fetch = vi.fn(async () => response(401));
  const request = createAuthorizedRequest({
    token: async () => "old",
    expired: async () => false,
    renew,
    scope: () => 0,
    fetch,
  });
  await expect(request("/notes")).rejects.toThrow("Session expirée");
  expect(renew).toHaveBeenCalledTimes(1);
  expect(fetch).toHaveBeenCalledTimes(2);
});
it("shares simultaneous renewals", async () => {
  let token = "old";
  let release: () => void = () => {};
  const pending = new Promise<void>((r) => {
    release = r;
  });
  const renew = vi.fn(async () => {
    await pending;
    token = "new";
    return token;
  });
  const fetch = vi.fn(async (_url: string, options?: RequestInit) =>
    response(
      (options?.headers as Record<string, string>).Token === "old" ? 401 : 200,
    ),
  );
  const request = createAuthorizedRequest({
    token: async () => token,
    expired: async () => false,
    renew,
    scope: () => 0,
    fetch,
  });
  const first = request("/a"),
    second = request("/b");
  await vi.waitFor(() => expect(renew).toHaveBeenCalledTimes(1));
  release();
  await Promise.all([first, second]);
  expect(renew).toHaveBeenCalledTimes(1);
});
it("stops after an initial renewal also receives 401", async () => {
  const renew = vi.fn(async () => "new"),
    fetch = vi.fn(async () => response(401));
  const request = createAuthorizedRequest({
    token: async () => null,
    expired: async () => true,
    renew,
    scope: () => 0,
    fetch,
  });
  await expect(request("/a")).rejects.toThrow("Session expirée");
  expect(fetch).toHaveBeenCalledTimes(1);
});
it("rejects late responses after account change", async () => {
  let scope = 0;
  let release: (r: Response) => void = () => {};
  const fetch = vi.fn(
    () =>
      new Promise<Response>((r) => {
        release = r;
      }),
  );
  const request = createAuthorizedRequest({
    token: async () => "old",
    expired: async () => false,
    renew: async () => null,
    scope: () => scope,
    fetch,
  });
  const pending = request("/a");
  await vi.waitFor(() => expect(fetch).toHaveBeenCalled());
  scope++;
  release(response(200));
  await expect(pending).rejects.toMatchObject({ name: "AbortError" });
});
it("passes cancellation and a deadline to fetch", async () => {
  const fetch = vi
    .spyOn(globalThis, "fetch")
    .mockImplementation(async (_u, init) => {
      if (init?.signal?.aborted)
        throw new DOMException("Aborted", "AbortError");
      return response(200);
    });
  const controller = new AbortController();
  controller.abort();
  await expect(
    timedFetch("/a", { signal: controller.signal }),
  ).rejects.toMatchObject({ name: "AbortError" });
  fetch.mockRestore();
});
it("keeps the deadline active until the response body is read", async () => {
  vi.useFakeTimers();
  const spy = vi.spyOn(globalThis, "fetch").mockImplementation(
    async (_url, init) =>
      ({
        headers: new Headers(),
        text: () =>
          new Promise<string>((_resolve, reject) =>
            init?.signal?.addEventListener(
              "abort",
              () => reject(new DOMException("Aborted", "AbortError")),
              { once: true },
            ),
          ),
      }) as Response,
  );
  const result = timedFetch("/slow", {}, 50);
  const assertion = expect(result).rejects.toMatchObject({
    name: "AbortError",
  });
  await vi.advanceTimersByTimeAsync(51);
  await assertion;
  spy.mockRestore();
  vi.useRealTimers();
});

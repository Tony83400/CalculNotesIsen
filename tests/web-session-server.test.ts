import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { createRequire } from "node:module";
const handler = createRequire(import.meta.url)("../api/session.js");
const credentials = {
  username: "fiction.camille",
  password: "mot-de-passe-fictif",
  remember: true,
};
function response() {
  return {
    statusCode: 0,
    text: "",
    headers: {} as Record<string, string>,
    setHeader(k: string, v: string) {
      this.headers[k] = v;
    },
    end(text = "") {
      this.text = text;
    },
  };
}
async function request(
  method = "POST",
  body: unknown = credentials,
  cookie = "",
  extra: Record<string, string> = {},
) {
  const res = response();
  await handler(
    {
      method,
      body,
      headers: {
        host: "app.example",
        origin: "https://app.example",
        "content-type": "application/json",
        "x-cnisen-session": "1",
        cookie,
        ...extra,
      },
    },
    res,
  );
  return res;
}
const rememberedCookie = (res: ReturnType<typeof response>) =>
  res.headers["Set-Cookie"].split(";")[0];
beforeEach(() => {
  vi.stubEnv("SESSION_ENCRYPTION_KEY", "ab".repeat(32));
  vi.stubEnv("VERCEL", "1");
  vi.spyOn(globalThis, "fetch").mockImplementation(
    async () => new Response("fiction-token"),
  );
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  vi.useRealTimers();
});
it("sets a server-encrypted HttpOnly Secure cookie for seven days only when requested", async () => {
  const res = await request();
  expect(res.statusCode).toBe(200);
  expect(res.headers["Set-Cookie"]).toMatch(/^__Secure-cnisen_remember=/);
  for (const flag of [
    "HttpOnly",
    "Secure",
    "SameSite=Strict",
    "Path=/api/session",
    "Max-Age=604800",
  ])
    expect(res.headers["Set-Cookie"]).toContain(flag);
  expect(res.headers["Set-Cookie"]).not.toContain("Domain=");
  expect(res.headers["Set-Cookie"].length).toBeLessThan(4096);
  expect(res.headers["Cache-Control"]).toBe("private, no-store");
  expect(JSON.parse(res.text)).toEqual({
    username: credentials.username,
    token: "fiction-token",
  });
  const ciphertext = Buffer.from(
    rememberedCookie(res).split("=")[1],
    "base64url",
  ).toString();
  expect(ciphertext).not.toContain(credentials.password);
  expect(ciphertext).not.toContain(credentials.username);
  expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  expect(
    vi.mocked(globalThis.fetch).mock.calls[0][1]?.headers,
  ).not.toHaveProperty("cookie");
});
it("restores a remembered login with no password sent by client JavaScript and no sliding expiry", async () => {
  const cookie = rememberedCookie(await request());
  vi.mocked(globalThis.fetch).mockClear();
  const resumed = await request("GET", undefined, cookie);
  expect(resumed.statusCode).toBe(200);
  expect(JSON.parse(resumed.text).username).toBe(credentials.username);
  expect(vi.mocked(globalThis.fetch).mock.calls[0][1]?.body).toBe(
    JSON.stringify({
      username: credentials.username,
      password: credentials.password,
    }),
  );
  expect(resumed.headers["Set-Cookie"]).toBeUndefined();
});
it("supports opting out and logout without an encryption key, and does not call upstream without a cookie", async () => {
  vi.stubEnv("SESSION_ENCRYPTION_KEY", "");
  const login = await request("POST", { ...credentials, remember: false });
  expect(login.statusCode).toBe(200);
  expect(login.headers["Set-Cookie"]).toContain("Max-Age=0");
  vi.mocked(globalThis.fetch).mockClear();
  expect((await request("GET")).statusCode).toBe(204);
  const logout = await request("DELETE");
  expect(logout.statusCode).toBe(204);
  expect(logout.headers["Set-Cookie"]).toContain("Max-Age=0");
  expect(globalThis.fetch).not.toHaveBeenCalled();
});
it("rejects a missing server key for remembered logins instead of storing secrets in the browser", async () => {
  vi.stubEnv("SESSION_ENCRYPTION_KEY", "");
  const res = await request();
  expect(res.statusCode).toBe(503);
  expect(globalThis.fetch).not.toHaveBeenCalled();
  expect(res.headers["Set-Cookie"]).toContain("Max-Age=0");
});
it("rejects tampering, expiry and rotation of the encryption key without trying upstream", async () => {
  const cookie = rememberedCookie(await request());
  vi.mocked(globalThis.fetch).mockClear();
  const prefix = cookie.slice(0, cookie.indexOf("=") + 1);
  const value = cookie.slice(prefix.length);
  const tampered = prefix + (value[0] === "A" ? "B" : "A") + value.slice(1);
  expect((await request("GET", undefined, tampered)).statusCode).toBe(401);
  vi.stubEnv("SESSION_ENCRYPTION_KEY", "cd".repeat(32));
  expect((await request("GET", undefined, cookie)).statusCode).toBe(401);
  vi.stubEnv("SESSION_ENCRYPTION_KEY", "ab".repeat(32));
  vi.useFakeTimers();
  vi.setSystemTime(Date.now() + 604801000);
  const expired = await request("GET", undefined, cookie);
  expect(expired.statusCode).toBe(401);
  expect(expired.headers["Set-Cookie"]).toContain("Max-Age=0");
  expect(globalThis.fetch).not.toHaveBeenCalled();
});
it("bounds failed reconnection to one request, clears rejected credentials and preserves a session during upstream outage", async () => {
  const cookie = rememberedCookie(await request());
  vi.mocked(globalThis.fetch)
    .mockClear()
    .mockImplementation(async () => new Response("", { status: 503 }));
  const outage = await request("GET", undefined, cookie);
  expect(outage.statusCode).toBe(502);
  expect(outage.headers["Set-Cookie"]).toBeUndefined();
  expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  vi.mocked(globalThis.fetch)
    .mockClear()
    .mockImplementation(async () => new Response("", { status: 401 }));
  const rejected = await request("GET", undefined, cookie);
  expect(rejected.statusCode).toBe(401);
  expect(rejected.headers["Set-Cookie"]).toContain("Max-Age=0");
  expect(globalThis.fetch).toHaveBeenCalledTimes(1);
});
it("blocks cross-site login/logout, unsupported methods and oversized or malformed input", async () => {
  expect(
    (await request("POST", credentials, "", { origin: "https://evil.example" }))
      .statusCode,
  ).toBe(403);
  expect(
    (await request("DELETE", undefined, "", { "sec-fetch-site": "cross-site" }))
      .statusCode,
  ).toBe(403);
  expect(
    (await request("GET", undefined, "", { "x-cnisen-session": "" }))
      .statusCode,
  ).toBe(403);
  expect((await request("PUT")).statusCode).toBe(405);
  expect(
    (await request("POST", { ...credentials, password: "x".repeat(9000) }))
      .statusCode,
  ).toBe(413);
  expect((await request("POST", "{")).statusCode).toBe(400);
  expect(
    (await request("POST", { username: "a", password: "", remember: true }))
      .statusCode,
  ).toBe(400);
  expect(globalThis.fetch).not.toHaveBeenCalled();
});
it("rejects oversized upstream tokens and enforces a deadline on stalled upstream requests", async () => {
  vi.mocked(globalThis.fetch).mockImplementation(
    async () => new Response("x".repeat(16001)),
  );
  expect((await request()).statusCode).toBe(502);
  vi.useFakeTimers();
  vi.mocked(globalThis.fetch).mockImplementation(
    (_url, init) =>
      new Promise((_resolve, reject) =>
        init?.signal?.addEventListener("abort", () =>
          reject(new Error("timeout")),
        ),
      ),
  );
  const pending = request();
  await vi.advanceTimersByTimeAsync(15001);
  expect((await pending).statusCode).toBe(504);
});

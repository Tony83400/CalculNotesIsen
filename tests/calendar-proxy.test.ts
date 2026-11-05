import { it, expect, vi, afterEach } from "vitest";
import { createRequire } from "node:module";
import { EventEmitter } from "node:events";
import https from "node:https";
const require = createRequire(import.meta.url);
const handler = require("../api/calendar.js");
function response() {
  const emitter = new EventEmitter();
  const res = Object.assign(emitter, {
    statusCode: 0,
    body: null as unknown,
    headers: {} as Record<string, unknown>,
    setHeader(k: string, v: unknown) {
      this.headers[k] = v;
    },
    status(n: number) {
      this.statusCode = n;
      return this;
    },
    json(v: unknown) {
      this.body = v;
      return this;
    },
    send(v: unknown) {
      this.body = v;
      return this;
    },
    end() {
      return this;
    },
  });
  return res;
}
afterEach(() => vi.restoreAllMocks());
it("rejects HTTP methods and invalid/query-array names without reaching upstream", () => {
  const get = vi.spyOn(https, "get");
  for (const [method, query, status] of [
    ["POST", { prenom: "Fictif", nom: "Test" }, 405],
    ["GET", { prenom: ["a", "b"], nom: "Test" }, 400],
    ["GET", { prenom: "../a", nom: "Test" }, 400],
  ] as const) {
    const res = response();
    handler({ method, query }, res);
    expect(res.statusCode).toBe(status);
  }
  expect(get).not.toHaveBeenCalled();
});
it("validates TLS, encodes names, sends no shared/private cache and propagates good ICS", () => {
  let callback: (
    r: EventEmitter & { statusCode: number; resume: () => void },
  ) => void = () => {};
  const request = Object.assign(new EventEmitter(), {
    setTimeout: vi.fn(),
    destroy: vi.fn(),
  });
  const get = vi.spyOn(https, "get").mockImplementation(((
    _url: unknown,
    _options: unknown,
    cb: typeof callback,
  ) => {
    callback = cb;
    return request;
  }) as unknown as typeof https.get);
  const res = response();
  handler(
    { method: "GET", query: { prenom: "Fictif é", nom: "D'Exemple" } },
    res,
  );
  expect(get.mock.calls[0][0]).toContain("fictif-%C3%A9.d-exemple.ics");
  expect(get.mock.calls[0][1]).toMatchObject({ rejectUnauthorized: true });
  const upstream = Object.assign(new EventEmitter(), {
    statusCode: 200,
    resume: vi.fn(),
  });
  callback(upstream);
  upstream.emit("data", Buffer.from("BEGIN:VCALENDAR\r\nEND:VCALENDAR"));
  upstream.emit("end");
  expect(res.statusCode).toBe(200);
  expect(res.headers["Cache-Control"]).toBe("private, no-store");
  expect(res.headers["Access-Control-Allow-Origin"]).toBeUndefined();
  request.emit("close");
});
it("reports upstream TLS failure instead of bypassing verification", () => {
  const request = Object.assign(new EventEmitter(), {
    setTimeout: vi.fn(),
    destroy: vi.fn(),
  });
  vi.spyOn(https, "get").mockReturnValue(
    request as unknown as ReturnType<typeof https.get>,
  );
  const res = response();
  handler({ method: "GET", query: { prenom: "Fictif", nom: "Test" } }, res);
  request.emit("error", new Error("certificate"));
  expect(res.statusCode).toBe(502);
  expect(res.body).toEqual({
    error: "Connexion sécurisée au calendrier amont impossible.",
  });
  request.emit("close");
});
it("rejects oversized or invalid upstream responses and preserves upstream 404", () => {
  let callback: (
    r: EventEmitter & { statusCode: number; resume: () => void },
  ) => void = () => {};
  const request = Object.assign(new EventEmitter(), {
    setTimeout: vi.fn(),
    destroy: vi.fn(),
  });
  vi.spyOn(https, "get").mockImplementation(((
    _url: unknown,
    _options: unknown,
    cb: typeof callback,
  ) => {
    callback = cb;
    return request;
  }) as unknown as typeof https.get);
  for (const mode of ["size", "html", "missing"]) {
    const res = response();
    handler({ method: "GET", query: { prenom: "Fictif", nom: "Test" } }, res);
    const upstream = Object.assign(new EventEmitter(), {
      statusCode: mode === "missing" ? 404 : 200,
      resume: vi.fn(),
    });
    callback(upstream);
    if (mode !== "missing") {
      upstream.emit(
        "data",
        Buffer.from(
          mode === "size"
            ? "a".repeat(4 * 1024 * 1024 + 1)
            : "<html>Error</html>",
        ),
      );
      upstream.emit("end");
    }
    expect(res.statusCode).toBe(mode === "missing" ? 404 : 502);
    request.emit("close");
  }
});

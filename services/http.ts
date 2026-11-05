export function abortError() {
  const e = new Error("Requête annulée");
  e.name = "AbortError";
  return e;
}
export class SessionExpiredError extends Error {
  constructor() {
    super("Session expirée. Reconnectez-vous pour actualiser.");
    this.name = "SessionExpiredError";
  }
}
export async function timedFetch(
  url: string,
  init: RequestInit = {},
  timeout = 15000,
): Promise<Response> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (init.signal?.aborted) controller.abort();
  else init.signal?.addEventListener("abort", abort, { once: true });
  const timer = setTimeout(abort, timeout);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    if (Number(response.headers.get("content-length") || 0) > 4 * 1024 * 1024)
      throw new Error("Réponse amont trop volumineuse.");
    const text = await response.text();
    if (text.length > 4 * 1024 * 1024)
      throw new Error("Réponse amont trop volumineuse.");
    if (controller.signal.aborted) throw abortError();
    return new Response(
      [204, 205, 304].includes(response.status) ? null : text,
      {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      },
    );
  } finally {
    clearTimeout(timer);
    controller.abort();
    init.signal?.removeEventListener("abort", abort);
  }
}
/** One shared renewal, at most two resource calls, no recursion. */
export function createAuthorizedRequest(deps: {
  token: () => Promise<string | null>;
  expired: () => Promise<boolean>;
  renew: () => Promise<string | null>;
  scope: () => number;
  fetch: typeof timedFetch;
}) {
  let renewal: Promise<string | null> | null = null;
  const renewOnce = () =>
    renewal ??
    (renewal = deps.renew().finally(() => {
      renewal = null;
    }));
  return async (url: string, signal?: AbortSignal) => {
    const scope = deps.scope();
    const check = () => {
      if (signal?.aborted || scope !== deps.scope()) throw abortError();
    };
    let token = await deps.token();
    const renewedInitially = !token || (await deps.expired());
    if (renewedInitially) token = await renewOnce();
    check();
    if (!token) throw new SessionExpiredError();
    let response = await deps.fetch(url, {
      headers: { Accept: "application/json", Token: token },
      signal,
    });
    check();
    if (response.status === 401 && !renewedInitially) {
      // Another caller may already have renewed the rejected token.
      const latest = await deps.token();
      token = latest && latest !== token ? latest : await renewOnce();
      check();
      if (token)
        response = await deps.fetch(url, {
          headers: { Accept: "application/json", Token: token },
          signal,
        });
    }
    check();
    if (response.status === 401) throw new SessionExpiredError();
    if (!response.ok)
      throw new Error(`Service ISEN indisponible (${response.status}).`);
    return response;
  };
}

import { Platform } from "react-native";
import { timedFetch } from "./http";

export interface WebSession {
  username: string;
  token: string;
}
const headers = { "Content-Type": "application/json", "X-CNISEN-Session": "1" };
let mutation: Promise<unknown> = Promise.resolve();
// Outside the cache prefix: clearing personal data must preserve an offline
// logout until the server cookie has actually been removed.
const LOGOUT_PENDING = "cnisen:logout-pending";
function pendingLogout() {
  try {
    return localStorage.getItem(LOGOUT_PENDING) === "1";
  } catch {
    return false;
  }
}
// A logout must reach the server after an in-flight remembered login, so a late
// Set-Cookie response can never silently reinstate the session after logout.
function serialize<T>(task: () => Promise<T>): Promise<T> {
  const next = mutation.then(task, task);
  mutation = next.catch(() => {});
  return next;
}
async function result(response: Response): Promise<WebSession> {
  const data = await response.json().catch(() => null);
  if (!response.ok)
    throw Object.assign(
      new Error(data?.error || "Connexion temporairement indisponible."),
      { status: response.status },
    );
  if (
    typeof data?.username !== "string" ||
    !data.username ||
    typeof data?.token !== "string" ||
    !data.token ||
    data.token.length > 16000
  )
    throw new Error("Réponse de connexion invalide.");
  return { username: data.username, token: data.token };
}
export function loginWeb(
  data: { username: string; password: string; remember?: boolean },
  signal?: AbortSignal,
) {
  return serialize(async () => {
    const session = await result(
      await timedFetch(
        "/api/session",
        {
          method: "POST",
          headers,
          credentials: "same-origin",
          cache: "no-store",
          body: JSON.stringify({ ...data, remember: data.remember === true }),
          signal,
        },
        20000,
      ),
    );
    try {
      localStorage.removeItem(LOGOUT_PENDING);
    } catch {}
    return session;
  });
}
let restoreFlight: Promise<WebSession | null> | null = null;
export async function restoreWebSession(): Promise<WebSession | null> {
  if (Platform.OS !== "web") return null;
  if (pendingLogout()) {
    await clearWebSession();
    return null;
  }
  return (
    restoreFlight ??
    (restoreFlight = mutation
      .then(async () => {
        const response = await timedFetch(
          "/api/session",
          { headers, credentials: "same-origin", cache: "no-store" },
          20000,
        );
        if ([204, 401].includes(response.status)) return null;
        return result(response);
      })
      .finally(() => {
        restoreFlight = null;
      }))
  );
}
export function clearWebSession() {
  if (Platform.OS !== "web") return Promise.resolve();
  const record = () => {
    try {
      localStorage.setItem(LOGOUT_PENDING, "1");
    } catch {}
  };
  record();
  return serialize(async () => {
    record();
    try {
      const response = await timedFetch("/api/session", {
        method: "DELETE",
        headers,
        credentials: "same-origin",
        cache: "no-store",
      });
      if (!response.ok)
        throw new Error(
          "Impossible de fermer la connexion mémorisée. Réessayez en ligne.",
        );
      try {
        localStorage.removeItem(LOGOUT_PENDING);
      } catch {}
    } catch (error) {
      // Offline logout still blocks restoration on this browser; retry deletion
      // before any future restore. If storage is also unavailable, report it.
      if (!pendingLogout()) throw error;
    }
  });
}

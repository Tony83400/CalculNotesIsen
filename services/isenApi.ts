import { API_URL } from "../constants/Config";
import {
  getToken,
  isTokenExpired,
  getId,
  getPasswordStorage,
  setToken,
} from "./storage";
import { getDataGeneration, assertCurrent } from "./dataScope";
import { timedFetch, createAuthorizedRequest } from "./http";
import { validateNotes } from "../utils/notes";
import type { EventDetails } from "../types/agenda";

export async function login(
  data: { username: string; password: string },
  signal?: AbortSignal,
) {
  const res = await timedFetch(`${API_URL}/token`, {
    method: "POST",
    headers: { Accept: "*/*", "Content-Type": "application/json" },
    body: JSON.stringify(data),
    signal,
  });
  if (!res.ok)
    throw Object.assign(
      new Error(
        [400, 401].includes(res.status)
          ? "Identifiant ou mot de passe incorrect."
          : `Connexion indisponible (${res.status}).`,
      ),
      { status: res.status },
    );
  const token = (await res.text()).trim();
  if (!token || token.length > 16000 || token.startsWith("<"))
    throw new Error("Réponse de connexion invalide.");
  return { token };
}
async function silentLogin() {
  const generation = getDataGeneration();
  const [username, password] = await Promise.all([
    getId(),
    getPasswordStorage(),
  ]);
  if (!username || !password) return null;
  try {
    const result = await login({ username, password });
    assertCurrent(generation);
    await setToken(result.token, generation);
    assertCurrent(generation);
    return result.token;
  } catch (e) {
    if ([400, 401].includes((e as { status: number }).status)) return null;
    throw e;
  }
}
const authorized = createAuthorizedRequest({
  token: getToken,
  expired: isTokenExpired,
  renew: silentLogin,
  scope: getDataGeneration,
  fetch: timedFetch,
});
export async function getNotes(signal?: AbortSignal) {
  return validateNotes(
    await (await authorized(`${API_URL}/notations`, signal)).json(),
  );
}
/** Require a unique exact time interval; never guess the nearest person's course. */
export async function getEventIdByTime(
  startTs: number,
  endTs: number,
  signal?: AbortSignal,
): Promise<string | null> {
  const res = await authorized(
    `${API_URL}/agenda?start=${startTs - 300000}&end=${endTs + 300000}`,
    signal,
  );
  const data = await res.json();
  if (!Array.isArray(data)) return null;
  const matches = data.filter(
    (e) =>
      (typeof e.id === "string" ||
        (typeof e.id === "number" && Number.isFinite(e.id))) &&
      Math.abs(+new Date(e.start) - startTs) <= 60000 &&
      Math.abs(+new Date(e.end) - endTs) <= 60000,
  );
  return matches.length === 1 ? String(matches[0].id) : null;
}
export async function getEventDetails(
  eventId: string,
  signal?: AbortSignal,
): Promise<EventDetails | null> {
  const data = await (
    await authorized(
      `${API_URL}/agenda/event/${encodeURIComponent(eventId)}`,
      signal,
    )
  ).json();
  if (
    !data ||
    typeof data !== "object" ||
    !Number.isFinite(Date.parse(data.start)) ||
    !Number.isFinite(Date.parse(data.end))
  )
    return null;
  const text = (key: string) =>
    typeof data[key] === "string" ? data[key] : "";
  const list = (key: string) =>
    Array.isArray(data[key])
      ? data[key].filter((v: unknown) => typeof v === "string")
      : [];
  return {
    start: text("start"),
    end: text("end"),
    status: text("status"),
    subject: text("subject"),
    type: text("type"),
    isPaper: data.isPaper === true,
    rooms: list("rooms"),
    teachers: list("teachers"),
    students: list("students"),
    groups: list("groups"),
    courseName: text("courseName"),
    module: text("module"),
  };
}

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
import { Platform } from "react-native";
import { loginWeb, restoreWebSession } from "./webSession";

export async function login(
  data: { username: string; password: string; remember?: boolean },
  signal?: AbortSignal,
) {
  if (Platform.OS === "web") return loginWeb(data, signal);
  const res = await timedFetch(`${API_URL}/token`, {
    method: "POST",
    headers: { Accept: "*/*", "Content-Type": "application/json" },
    body: JSON.stringify({ username: data.username, password: data.password }),
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
  if (Platform.OS === "web") {
    const username = await getId();
    const session = await restoreWebSession();
    assertCurrent(generation);
    if (!session || session.username !== username) return null;
    await setToken(session.token, generation);
    return session.token;
  }
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
/** API timestamps may be ISO strings, Unix milliseconds or Unix seconds. */
function eventTimestamp(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value))
    return Math.abs(value) < 1e11 ? value * 1000 : value;
  if (typeof value !== "string" || !value.trim()) return NaN;
  if (/^\d{10}(?:\.\d+)?$|^\d{13}$/.test(value))
    return eventTimestamp(Number(value));
  return Date.parse(value);
}
/** Match only the owner's agenda. Missing end is acceptable only for a unique
 * matching start; a supplied end must agree and ambiguity is never guessed. */
export async function getEventIdByTime(
  startTs: number,
  endTs: number,
  signal?: AbortSignal,
): Promise<string | null> {
  const res = await authorized(
    `${API_URL}/agenda?start=${startTs - 300000}&end=${endTs + 300000}`,
    signal,
  );
  const data: unknown = await res.json();
  if (!Array.isArray(data))
    throw new Error(
      "Le format de l’agenda personnel renvoyé par ISEN n’est pas reconnu.",
    );
  const rows = data.filter(
    (e) =>
      e &&
      typeof e === "object" &&
      ((typeof e.id === "string" && e.id.trim()) ||
        (typeof e.id === "number" && Number.isFinite(e.id))),
  );
  if (
    data.length &&
    !rows.some((e) => Number.isFinite(eventTimestamp(e.start)))
  )
    throw new Error(
      "Les horaires de l’agenda personnel renvoyés par ISEN ne sont pas reconnus.",
    );
  const starts = rows.filter(
    (e) => Math.abs(eventTimestamp(e.start) - startTs) <= 60000,
  );
  const hasEnd = (e: Record<string, unknown>) =>
    e.end !== undefined && e.end !== null && e.end !== "";
  if (starts.length === 1) {
    const e = starts[0];
    if (!hasEnd(e) || Math.abs(eventTimestamp(e.end) - endTs) <= 60000)
      return String(e.id);
    return null;
  }
  if (starts.length > 1) {
    if (
      starts.some((e) => !hasEnd(e) || !Number.isFinite(eventTimestamp(e.end)))
    )
      throw new Error(
        "Plusieurs cours personnels commencent à cet horaire ; impossible d’identifier le bon avec certitude.",
      );
    const exact = starts.filter(
      (e) => Math.abs(eventTimestamp(e.end) - endTs) <= 60000,
    );
    if (exact.length === 1) return String(exact[0].id);
  }
  return null;
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
    Array.isArray(data) ||
    ![
      "students",
      "teachers",
      "rooms",
      "groups",
      "subject",
      "courseName",
      "module",
      "status",
    ].some((key) => key in data)
  )
    throw new Error(
      "Le format des détails du cours renvoyé par ISEN n’est pas reconnu.",
    );
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

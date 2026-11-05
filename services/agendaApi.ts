import { CALENDAR_URL } from "../constants/Config";
import { parseAgenda } from "../utils/agenda";
import { timedFetch } from "./http";
import { getId } from "./storage/authStorage";
export async function fetchCalendar(
  prenom: string,
  nom: string,
  signal?: AbortSignal,
) {
  const query = `prenom=${encodeURIComponent(prenom)}&nom=${encodeURIComponent(nom)}`;
  const response = await timedFetch(`${CALENDAR_URL}?${query}`, {
    headers: { Accept: "text/calendar" },
    cache: "no-store",
    signal,
  });
  if (!response.ok)
    throw new Error(
      response.status === 404
        ? "Agenda introuvable. Vérifiez le prénom et le nom."
        : `Agenda indisponible (${response.status}).`,
    );
  return parseAgenda(await response.text());
}
export async function getAgendaFor(id: string, signal?: AbortSignal) {
  const name = id.split("@")[0];
  const dot = name.indexOf(".");
  if (dot < 1 || dot === name.length - 1)
    throw new Error(
      "L’agenda nécessite un identifiant de la forme prénom.nom.",
    );
  return fetchCalendar(name.slice(0, dot), name.slice(dot + 1), signal);
}
export async function getAgendaIsen(signal?: AbortSignal) {
  const id = await getId();
  if (!id) throw new Error("Connectez-vous pour accéder à votre agenda.");
  return getAgendaFor(id, signal);
}

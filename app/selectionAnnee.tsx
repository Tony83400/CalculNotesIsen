import React, { useEffect, useState } from "react";
import { View, Text, Platform, Switch } from "react-native";
import { router } from "expo-router";
import AppShell from "../components/AppShell";
import { useAppData } from "../providers/AppData";
import structure from "../structures_notes/structure.json";
import { updateStructureConfig } from "../services/configApi";
import {
  notificationsEnabled,
  setNotificationsEnabled,
  programmerNotifications,
} from "../utils/notifications";
import { Button, Notice, ui } from "../components/ui/Primitives";
import { Colors as C } from "../constants/Colors";
import { Theme } from "../constants/Theme";
type Catalog = {
  annee: Record<string, Record<string, Record<string, string>>>;
};
export default function Settings() {
  const app = useAppData(),
    [catalog, setCatalog] = useState<Catalog>(structure),
    [year, setYear] = useState(app.year),
    [majors, setMajors] = useState(app.majors),
    [saving, setSaving] = useState(false),
    [error, setError] = useState(""),
    [notification, setNotification] = useState(false),
    [notificationError, setNotificationError] = useState("");
  useEffect(() => {
    let alive = true;
    void updateStructureConfig().then((c) => {
      if (alive && c?.annee) setCatalog(c);
    });
    void notificationsEnabled().then((v) => {
      if (alive) setNotification(v);
    });
    return () => {
      alive = false;
    };
  }, []);
  useEffect(() => {
    if (app.ready) {
      setYear(app.year);
      setMajors(app.majors);
    }
  }, [app.ready, app.year, app.majors]);
  const semesters = year ? Object.keys(catalog.annee[year] || {}) : [];
  const valid =
    !!year &&
    semesters.length > 0 &&
    semesters.every((s) => catalog.annee[year][s][majors[s]]);
  const save = async () => {
    if (!valid || !year) return;
    setSaving(true);
    setError("");
    try {
      if (app.demo) {
        setError(
          "La démonstration présente un cursus fictif M1. Connectez-vous pour enregistrer votre propre cursus.",
        );
        return;
      }
      const selected = Object.fromEntries(semesters.map((s) => [s, majors[s]]));
      const urls = Object.fromEntries(
        semesters.map((s) => [s, catalog.annee[year][s][majors[s]]]),
      );
      await app.saveCurriculum(year, selected, urls);
      router.replace("/selection");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };
  const selectYear = (y: string) => {
    setYear(y);
    setMajors(
      Object.fromEntries(
        Object.entries(catalog.annee[y])
          .filter(([, m]) => Object.keys(m).length === 1)
          .map(([s, m]) => [s, Object.keys(m)[0]]),
      ),
    );
    setError("");
  };
  return (
    <AppShell title="Mon cursus" kicker="Réglages">
      <Text style={[ui.small, { marginBottom: 24 }]}>
        Une configuration pour toute l’année. Vous pourrez changer de semestre
        directement dans vos notes.
      </Text>
      <View style={[ui.panel, { padding: 24, gap: 28, maxWidth: 900 }]}>
        <View style={{ gap: 12 }}>
          <Text accessibilityRole="header" style={sTitle}>
            01 · Votre année
          </Text>
          <View style={ui.wrap}>
            {Object.keys(catalog.annee).map((y) => {
              const available = Object.keys(catalog.annee[y]).length > 0;
              return (
                <Button
                  key={y}
                  label={available ? y : `${y} · indisponible`}
                  variant={year === y ? "primary" : "default"}
                  disabled={!available}
                  onPress={() => selectYear(y)}
                />
              );
            })}
          </View>
          <Text style={ui.small}>
            N2 n’est pas renseignée dans le catalogue du projet.
          </Text>
        </View>
        {year === "N1" && (
          <Notice>
            Le semestre S2 est vide dans la configuration fournie. S1 reste
            consultable ; S2 apparaîtra comme indisponible tant que sa structure
            ne sera pas renseignée.
          </Notice>
        )}
        {semesters.map((s) => (
          <View
            key={s}
            style={{
              gap: 12,
              paddingTop: 24,
              borderTopWidth: 1,
              borderTopColor: C.border,
            }}
          >
            <Text accessibilityRole="header" style={sTitle}>
              {s} · Votre filière
            </Text>
            <View style={ui.wrap}>
              {Object.keys(catalog.annee[year!][s]).map((m) => (
                <Button
                  key={m}
                  label={m.replace(/_/g, " ")}
                  variant={majors[s] === m ? "primary" : "default"}
                  onPress={() =>
                    setMajors((p) => {
                      const n = { ...p, [s]: m };
                      for (const sem of semesters)
                        if (catalog.annee[year!][sem][m]) n[sem] = m;
                      return n;
                    })
                  }
                />
              ))}
            </View>
          </View>
        ))}
        {error && <Notice error>{error}</Notice>}
        <View style={ui.wrap}>
          <Button
            label="Enregistrer mon cursus"
            variant="primary"
            disabled={!valid}
            loading={saving}
            onPress={() => void save()}
          />
          <Button
            label="Revenir à l’accueil"
            variant="quiet"
            onPress={() => router.navigate("/selection")}
          />
        </View>
      </View>
      <View style={{ marginTop: 32, maxWidth: 900, gap: 16 }}>
        <Text accessibilityRole="header" style={sTitle}>
          Rappels de cours
        </Text>
        {Platform.OS === "web" ? (
          <Text style={ui.small}>
            Disponibles dans l’application Android et iOS : un rappel 30 minutes
            avant les cours des quatre prochains jours, après une actualisation
            de l’agenda.
          </Text>
        ) : (
          <View style={ui.row}>
            <Switch
              accessibilityLabel="Rappels 30 minutes avant les cours"
              value={notification}
              disabled={app.demo}
              onValueChange={(v) => {
                void (async () => {
                  const enabled = await setNotificationsEnabled(v);
                  setNotification(enabled);
                  setNotificationError(
                    v && !enabled
                      ? "Autorisez les notifications dans les réglages de votre appareil."
                      : "",
                  );
                  if (enabled) void programmerNotifications(app.agenda.data);
                })();
              }}
              trackColor={{ true: C.primary }}
            />
            <Text style={[ui.small, { flex: 1 }]}>
              30 minutes avant chaque cours · quatre prochains jours
            </Text>
          </View>
        )}
        {notificationError && <Notice error>{notificationError}</Notice>}
        <View style={ui.rule} />
        <Text accessibilityRole="header" style={sTitle}>
          Votre session
        </Text>
        <Text style={ui.small}>
          {app.demo
            ? "Démonstration : aucune donnée personnelle."
            : Platform.OS === "web"
              ? "Si vous avez coché « Rester connecté », la connexion reprend automatiquement pendant 7 jours grâce à un cookie chiffré par le serveur. La déconnexion supprime cette connexion mémorisée. Le mot de passe n’est jamais enregistré en clair dans le navigateur."
              : "Le jeton et les identifiants mémorisés sont conservés dans SecureStore. La déconnexion les efface et annule les rappels."}
        </Text>
        <View style={{ alignSelf: "flex-start" }}>
          <Button
            label={app.demo ? "Quitter la démonstration" : "Se déconnecter"}
            variant="danger"
            onPress={() => {
              void app.logout().then((ok) => {
                if (ok) router.replace("/");
              });
            }}
          />
        </View>
        <Text style={[ui.small, { fontSize: 12 }]}>
          CalculNotesISEN · créé par Anthony Coulais et Mattéo Sautron. Les
          structures JSON configurent les calculs ; leur conformité au règlement
          pédagogique doit être vérifiée auprès de l’établissement.
        </Text>
      </View>
    </AppShell>
  );
}
const sTitle = {
  fontSize: 20,
  fontFamily: Theme.font.heading,
  color: C.text.primary,
};

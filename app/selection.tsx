import React, { useMemo } from "react";
import { View, Text, StyleSheet, useWindowDimensions } from "react-native";
import { router } from "expo-router";
import { RefreshCw } from "lucide-react-native";
import AppShell, { RouteLink } from "../components/AppShell";
import { useAppData } from "../providers/AppData";
import calc, { noteTimestamp } from "../utils/notes";
import { formatTime, formatFullDate, eventsOnDay } from "../utils/agenda";
import { Colors as C } from "../constants/Colors";
import { Theme } from "../constants/Theme";
import {
  Badge,
  Body,
  Button,
  Empty,
  Eyebrow,
  ResourceStatus,
  ui,
} from "../components/ui/Primitives";
const fmt = (n: number | null | undefined) =>
  n == null
    ? "—"
    : n.toLocaleString("fr-FR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
export default function Home() {
  const app = useAppData(),
    { width } = useWindowDimensions();
  const result = useMemo(
    () =>
      calc(
        app.configs[app.semester || ""] || [],
        app.notes.data,
        {},
        false,
        app.semester || undefined,
      ),
    [app.configs, app.semester, app.notes.data],
  );
  const next = app.agenda.data.find((e) => +e.end > Date.now());
  const today = eventsOnDay(app.agenda.data, new Date());
  const latest = [...app.notes.data]
    .sort((a, b) => noteTimestamp(b.date) - noteTimestamp(a.date))
    .slice(0, 4);
  const wide = width >= 1150;
  return (
    <AppShell
      title="Mon semestre"
      kicker={`${app.year || "Mon carnet"} · ${app.semester || "Cursus à configurer"}`}
      actions={
        <Button
          label="Actualiser"
          icon={<RefreshCw strokeWidth={1.5} size={18} color={C.primary} />}
          loading={
            app.notes.status === "loading" || app.agenda.status === "loading"
          }
          onPress={() => void app.refresh()}
        />
      }
    >
      {!app.semester && (
        <View style={[ui.panel, { padding: 24, gap: 12, marginBottom: 24 }]}>
          <Body>Votre carnet commence par votre cursus.</Body>
          <Button
            label="Choisir mon année et ma filière"
            variant="primary"
            onPress={() => router.navigate("/selectionAnnee")}
          />
        </View>
      )}
      <View
        style={[
          s.top,
          wide ? { flexDirection: "row" } : { flexDirection: "column" },
        ]}
      >
        <View style={[s.next, wide && { flex: 1.6 }]}>
          <View
            style={[
              ui.wrap,
              { justifyContent: "space-between", marginBottom: 24 },
            ]}
          >
            <Eyebrow>Prochain cours</Eyebrow>
            {next && (
              <Badge tone={next.isExam ? "warning" : "success"}>
                {next.isExam ? "Examen" : "Cours"}
              </Badge>
            )}
          </View>
          {next ? (
            <>
              <Text style={s.courseTitle}>{next.title}</Text>
              <Text style={s.courseDate}>{formatFullDate(next.start)}</Text>
              <View style={[ui.row, { marginTop: 24, flexWrap: "wrap" }]}>
                <Text style={s.time}>
                  {formatTime(next.start)} → {formatTime(next.end)}
                </Text>
                <Text style={ui.small}>{next.location}</Text>
              </View>
              <View
                style={[
                  ui.wrap,
                  { marginTop: 24, justifyContent: "space-between" },
                ]}
              >
                <Text style={ui.small}>
                  {today.length
                    ? `${today.length} cours dans votre journée`
                    : "Pas de cours aujourd’hui"}
                </Text>
                <RouteLink label="Voir mon agenda" to="/agenda" />
              </View>
            </>
          ) : (
            <Empty
              title={
                app.agenda.status === "loading"
                  ? "Recherche du prochain cours…"
                  : "Aucun cours à venir"
              }
              detail={
                app.agenda.error
                  ? "L’agenda n’a pas pu être récupéré."
                  : "Les prochains cours apparaîtront ici dès que votre agenda sera disponible."
              }
            />
          )}
          <ResourceStatus {...app.agenda} demo={app.demo} />
        </View>
        <View style={[s.progress, wide && { flex: 1 }]}>
          <Eyebrow>Résultats du semestre</Eyebrow>
          <View style={[ui.row, { alignItems: "baseline", marginTop: 24 }]}>
            <Text style={s.average}>{fmt(result.stats.moyenne)}</Text>
            <Text style={ui.small}>/ 20 · provisoire</Text>
          </View>
          <Text style={[ui.small, { marginTop: 4 }]}>
            Moyenne estimée sur les notes publiées
          </Text>
          <View style={s.track}>
            <View
              style={{
                height: 4,
                width: `${result.stats.total ? (100 * result.stats.published) / result.stats.total : 0}%`,
                backgroundColor: C.primary,
              }}
            />
          </View>
          <View style={[ui.row, { justifyContent: "space-between" }]}>
            <Text style={ui.small}>Évaluations publiées</Text>
            <Text style={[ui.small, { fontWeight: "500" }]}>
              {result.stats.published} / {result.stats.total}
            </Text>
          </View>
          <View style={[ui.rule, { marginVertical: 16 }]} />
          <View style={[ui.row, { justifyContent: "space-between" }]}>
            <Text style={ui.small}>ECTS estimés acquis</Text>
            <Text style={[ui.small, { fontWeight: "500" }]}>
              {result.stats.ects} / {result.stats.totalEcts}
            </Text>
          </View>
          <RouteLink label="Détail des résultats" to="/notes" />
        </View>
      </View>
      <View
        style={[
          ui.wrap,
          { justifyContent: "space-between", marginTop: 32, marginBottom: 16 },
        ]}
      >
        <Text accessibilityRole="header" style={s.sectionTitle}>
          Dernières notes
        </Text>
        <RouteLink label="Toutes mes notes" to="/notes" />
      </View>
      <View style={ui.panel}>
        {latest.length ? (
          latest.map((n, i) => (
            <View
              key={`${n.code}:${i}`}
              style={[
                s.resultRow,
                i > 0 && { borderTopWidth: 1, borderTopColor: C.divider },
              ]}
            >
              <View style={{ flex: 1, gap: 4 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "500",
                    color: C.text.primary,
                  }}
                >
                  {n.name}
                </Text>
                <Text style={ui.small}>
                  Publiée{n.date ? ` · ${n.date}` : ""}
                </Text>
              </View>
              <Text style={s.grade}>
                {fmt(n.note)}
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "400",
                    color: C.text.secondary,
                  }}
                >
                  {" "}
                  / 20
                </Text>
              </Text>
            </View>
          ))
        ) : (
          <View style={{ paddingHorizontal: 24 }}>
            <Empty
              title={
                app.notes.status === "loading"
                  ? "Récupération de vos résultats…"
                  : "Aucune note publiée"
              }
              detail="Vous pouvez déjà ouvrir le semestre et simuler les évaluations à venir."
            />
          </View>
        )}
      </View>
      <View style={{ marginTop: 12 }}>
        <ResourceStatus {...app.notes} demo={app.demo} />
      </View>
      <View style={[s.shortcuts, width < 650 && { flexDirection: "column" }]}>
        <View style={s.shortcut}>
          <View style={{ flex: 1, gap: 8 }}>
            <Text style={s.shortcutTitle}>Simuler une évaluation</Text>
            <Text style={ui.small}>
              Testez une hypothèse sans toucher aux résultats publiés.
            </Text>
          </View>
          <Button label="Simuler" onPress={() => router.navigate("/notes")} />
        </View>
        <View style={s.shortcut}>
          <View style={{ flex: 1, gap: 8 }}>
            <Text style={s.shortcutTitle}>Comparer les emplois du temps</Text>
            <Text style={ui.small}>Comparez plusieurs emplois du temps.</Text>
          </View>
          <Button
            label="Comparer"
            onPress={() => router.navigate("/multi-agenda")}
          />
        </View>
      </View>
    </AppShell>
  );
}
const s = StyleSheet.create({
  top: { gap: 20 },
  next: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderLeftWidth: 4,
    borderLeftColor: C.brand.coral,
    borderRadius: 6,
    padding: 24,
    minWidth: 0,
  },
  progress: {
    padding: 24,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 6,
    minWidth: 0,
  },
  courseTitle: {
    fontFamily: Theme.font.heading,
    fontSize: 28,
    lineHeight: 36,
    color: C.text.primary,
  },
  courseDate: { fontSize: 14, color: C.text.secondary, marginTop: 12 },
  time: { fontSize: 24, fontVariant: ["tabular-nums"], color: C.primary },
  average: {
    fontSize: 36,
    fontWeight: "500",
    color: C.text.primary,
    fontVariant: ["tabular-nums"],
  },
  track: {
    height: 4,
    backgroundColor: C.border,
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: Theme.font.heading,
    fontSize: 23,
    color: C.text.primary,
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  grade: {
    fontSize: 21,
    fontWeight: "500",
    fontVariant: ["tabular-nums"],
    color: C.text.primary,
  },
  shortcuts: { flexDirection: "row", gap: 24, marginTop: 32, flexWrap: "wrap" },
  shortcut: {
    flex: 1,
    minWidth: 240,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: C.border,
    flexWrap: "wrap",
  },
  shortcutIndex: {
    fontFamily: Theme.font.heading,
    fontSize: 22,
    color: C.text.tertiary,
  },
  shortcutTitle: { fontSize: 14, fontWeight: "500", color: C.text.primary },
});

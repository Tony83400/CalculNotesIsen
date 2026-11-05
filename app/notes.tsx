import { themedStyles } from "../constants/themedStyles";
import React, { useMemo, useState } from "react";
import { View, Text, useWindowDimensions } from "react-native";
import { RefreshCw } from "lucide-react-native";
import AppShell from "../components/AppShell";
import { useAppData } from "../providers/AppData";
import calc from "../utils/notes";
import UeCard from "../components/ui/notes/UeList";
import { Colors as C } from "../constants/Colors";
import { Theme } from "../constants/Theme";
import {
  Badge,
  Button,
  Empty,
  Notice,
  ResourceStatus,
  ui,
} from "../components/ui/Primitives";
export default function Notes() {
  const app = useAppData(),
    [retakes, setRetakes] = useState(false),
    { width } = useWindowDimensions();
  const result = useMemo(
    () =>
      calc(
        app.configs[app.semester || ""] || [],
        app.notes.data,
        app.simulations,
        retakes,
        app.semester || undefined,
      ),
    [app.configs, app.semester, app.notes.data, app.simulations, retakes],
  );
  const base = useMemo(
    () =>
      calc(
        app.configs[app.semester || ""] || [],
        app.notes.data,
        {},
        retakes,
        app.semester || undefined,
      ),
    [app.configs, app.semester, app.notes.data, retakes],
  );
  const missingCodes = (app.configs[app.semester || ""] || [])
    .flatMap((u) => u.matieres.flatMap((m) => m.evaluations))
    .filter((e) => !e.code).length;
  const count = Object.values(app.simulations).filter((v) => v != null).length;
  const mean = (v: number | null) =>
    v == null
      ? "—"
      : v.toLocaleString("fr-FR", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
  return (
    <AppShell
      title="Mes notes"
      kicker="Notes et simulations"
      actions={
        <Button
          label="Actualiser"
          loading={app.notes.status === "loading"}
          icon={<RefreshCw strokeWidth={1.5} size={18} color={C.primary} />}
          onPress={() => void app.refresh()}
        />
      }
    >
      <View
        style={[ui.wrap, { justifyContent: "space-between", marginBottom: 24 }]}
      >
        <View style={ui.wrap}>
          {Object.keys(app.majors).map((sem) => (
            <Button
              key={sem}
              label={`${sem} · ${app.majors[sem].replace(/_/g, " ")}`}
              variant={sem === app.semester ? "primary" : "default"}
              onPress={() => void app.selectSemester(sem)}
            />
          ))}
        </View>
        <View style={ui.wrap}>
          <Button
            label="Standard"
            variant={!retakes ? "primary" : "default"}
            onPress={() => setRetakes(false)}
          />
          <Button
            label="Rattrapages"
            variant={retakes ? "primary" : "default"}
            onPress={() => setRetakes(true)}
          />
        </View>
      </View>
      <View style={s.stats}>
        <View style={[s.stat, width < 600 && { padding: 12 }]}>
          <Text style={s.label}>
            {width < 600
              ? count
                ? "Avec simulation"
                : "Moy. provisoire"
              : count
                ? "Moyenne avec simulations"
                : "Moyenne provisoire"}
          </Text>
          <View
            style={[
              ui.row,
              { alignItems: "baseline", flexWrap: "wrap", gap: 4 },
            ]}
          >
            <Text style={[s.big, width < 600 && { fontSize: 30 }]}>
              {mean(result.stats.moyenne)}
            </Text>
            <Text style={ui.small}>/ 20</Text>
          </View>
          {count > 0 && (
            <Text style={ui.small}>
              Sans simulation : {mean(base.stats.moyenne)} / 20
            </Text>
          )}
        </View>
        <View style={[s.stat, width < 600 && { padding: 12 }]}>
          <Text style={s.label}>
            {width < 600 ? "ECTS estimés" : "ECTS · validation estimée"}
          </Text>
          <Text style={[s.medium, width < 600 && { fontSize: 28 }]}>
            {result.stats.ects}
            <Text style={ui.small}> / {result.stats.totalEcts}</Text>
          </Text>
          {width >= 600 && (
            <Text style={ui.small}>UE complètes ≥ 10 · matières ≥ 6</Text>
          )}
        </View>
        <View style={[s.stat, width < 600 && { padding: 12 }]}>
          <Text style={s.label}>
            {width < 600 ? "Publiées" : "Notes publiées"}
          </Text>
          <Text style={[s.medium, width < 600 && { fontSize: 28 }]}>
            {result.stats.published}
            <Text style={ui.small}> / {result.stats.total}</Text>
          </Text>
          {width >= 600 && (
            <Text style={ui.small}>
              {result.stats.total - result.stats.published} évaluation(s) en
              attente
            </Text>
          )}
        </View>
      </View>
      <View style={{ marginVertical: 16, gap: 12 }}>
        <ResourceStatus {...app.notes} demo={app.demo} />
        <Text style={ui.small}>
          Estimations de l’application, non officielles. Les notes manquantes
          sont exclues des moyennes provisoires et empêchent de conclure à la
          validation d’une UE.
        </Text>
        {app.semester && app.configs[app.semester]?.length === 0 && (
          <Notice>
            Le catalogue ne renseigne pas encore la structure de ce semestre.
            Aucune moyenne de semestre ne peut être calculée.
          </Notice>
        )}
        {missingCodes > 0 && (
          <Notice>
            {missingCodes} évaluation(s) sans code dans la configuration du
            cursus. Leurs résultats ne peuvent pas être associés automatiquement
            ; les notes non associées restent hors moyenne.
          </Notice>
        )}
        {app.year === "ISENA4" && (
          <Notice>
            ISENA4 · Coefficients d’évaluation provisoires : 1. La répartition
            DS/partiel reste à confirmer ; les projets et l’entreprise disposent
            d’une évaluation provisoire dédiée.
          </Notice>
        )}
        {retakes && (
          <Notice>
            Règle à confirmer : le meilleur rattrapage améliore les évaluations
            concernées, puis la moyenne de l’UE est plafonnée à 10. Ce
            comportement existant est conservé en attendant le règlement.
          </Notice>
        )}
        {count > 0 && (
          <View style={[s.simulations, ui.wrap]}>
            <Badge tone="info">
              {count} simulation{count > 1 ? "s" : ""} active
              {count > 1 ? "s" : ""}
            </Badge>
            <Text style={[ui.small, { flex: 1, minWidth: 140 }]}>
              Les notes sources sont conservées.
            </Text>
            <Button label="Tout réinitialiser" onPress={app.resetSimulations} />
          </View>
        )}
      </View>
      <View
        style={[ui.wrap, { justifyContent: "space-between", marginBottom: 12 }]}
      >
        <Text style={s.sectionTitle}>Unités d’enseignement</Text>
        <Text style={[ui.small, { fontSize: 11 }]}>
          Déplier une matière pour simuler
        </Text>
      </View>
      {result.structure.map((u, i) => (
        <UeCard
          key={`${app.generation}:${app.semester}:${i}`}
          Ue={u}
          simulatedNotes={app.simulations}
          updateSimulation={app.updateSimulation}
        />
      ))}
      {!result.structure.length && (
        <Empty
          title={
            app.semester
              ? "Structure du semestre indisponible."
              : "Un semestre à configurer."
          }
          detail={
            app.semester
              ? "Le catalogue du projet ne renseigne pas encore les UE de ce semestre. Choisissez un autre semestre ; les notes publiées restent consultables hors structure."
              : "Choisissez votre cursus dans les réglages pour afficher les UE et leurs évaluations."
          }
        />
      )}
    </AppShell>
  );
}
const s = themedStyles(() => ({
  stats: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 6,
    backgroundColor: C.surface,
  },
  stat: { flex: 1, padding: 24, gap: 8, minWidth: 0 },
  label: {
    fontSize: 12,
    fontWeight: "500",
    letterSpacing: 0,
    color: C.text.secondary,
  },
  big: {
    fontSize: 36,
    fontWeight: "500",
    color: C.text.primary,
    fontVariant: ["tabular-nums"],
  },
  medium: {
    fontSize: 32,
    fontWeight: "500",
    color: C.text.primary,
    fontVariant: ["tabular-nums"],
  },
  sectionTitle: {
    fontFamily: Theme.font.heading,
    fontSize: 21,
    color: C.text.primary,
  },
  simulations: {
    padding: 12,
    backgroundColor: C.feedback.infoBackground,
    borderLeftWidth: 3,
    borderLeftColor: C.status.info,
  },
}));

import React, { useState } from "react";
import {
  Text,
  View,
  Pressable,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { ChevronDown, ChevronRight } from "lucide-react-native";
import type { Ue as UeType, Matiere } from "../../../types/note";
import { Colors as C } from "../../../constants/Colors";
import { Badge, ui } from "../Primitives";
import MatiereCard from "./MatiereCard";
const fmt = (n: number | null | undefined) =>
  n == null
    ? "—"
    : n.toLocaleString("fr-FR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
export default function UeCard({
  Ue: u,
  simulatedNotes,
  updateSimulation,
}: {
  Ue: UeType;
  simulatedNotes: Record<string, number | null>;
  updateSimulation: (id: string, v: number | null) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const status = u.outsideStructure
    ? "Hors moyenne"
    : u.moyenne == null
      ? "En attente"
      : !u.isComplete
        ? "Provisoire"
        : u.isValidated
          ? "Validation estimée"
          : "À consolider";
  return (
    <View style={[ui.panel, { marginBottom: 16, overflow: "hidden" }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${u.ue}, ${status}, moyenne ${fmt(u.moyenne)}`}
        accessibilityState={{ expanded }}
        onPress={() => setExpanded(!expanded)}
        style={s.ueHeader}
      >
        <View
          style={[ui.row, { flex: 1, minWidth: 0, alignItems: "flex-start" }]}
        >
          {expanded ? (
            <ChevronDown strokeWidth={1.5} size={18} color={C.primary} />
          ) : (
            <ChevronRight strokeWidth={1.5} size={18} color={C.primary} />
          )}
          <View style={{ flex: 1, gap: 8 }}>
            <Text style={s.ueTitle}>{u.ue}</Text>
            <View style={ui.wrap}>
              <Text style={ui.small}>{u.ects} ECTS</Text>
              <Badge tone={u.isValidated ? "success" : "neutral"}>
                {status}
              </Badge>
              {u.hasSimulation && <Badge tone="info">Avec simulation</Badge>}
              {u.hasEliminatoryNote && (
                <Badge tone="error">Matière sous 6/ 20</Badge>
              )}
              {u.hasRattrapageApplied && (
                <Badge tone="warning">Plafond 10 appliqué</Badge>
              )}
            </View>
          </View>
        </View>
        <View style={{ alignItems: "flex-end", gap: 4 }}>
          <Text style={s.ueAverage}>{fmt(u.moyenne)}</Text>
          <Text style={[ui.small, { fontSize: 11 }]}>/ 20</Text>
        </View>
      </Pressable>
      {expanded && (
        <View>
          {u.outsideStructure && (
            <Text style={[ui.small, { padding: 16 }]}>
              Ces résultats n’ont pas pu être associés avec certitude au cursus.
              Ils sont exclus des moyennes et des ECTS.
            </Text>
          )}
          {u.matieres.map((m, i) => (
            <Subject
              key={`${m.name}:${i}`}
              subject={m}
              simulatedNotes={simulatedNotes}
              updateSimulation={updateSimulation}
              readOnly={u.outsideStructure}
            />
          ))}
        </View>
      )}
    </View>
  );
}
function Subject({
  subject: m,
  simulatedNotes,
  updateSimulation,
  readOnly,
}: {
  subject: Matiere;
  simulatedNotes: Record<string, number | null>;
  updateSimulation: (id: string, v: number | null) => void;
  readOnly?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const { width } = useWindowDimensions();
  const count = m.evaluations.filter((e) => e.hasApiNote).length;
  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${m.name}, ${count} notes publiées sur ${m.evaluations.length}, moyenne ${fmt(m.moyenne)}`}
        accessibilityState={{ expanded }}
        onPress={() => setExpanded(!expanded)}
        style={s.subject}
      >
        <View style={[ui.row, { flex: 1, minWidth: 0 }]}>
          {expanded ? (
            <ChevronDown strokeWidth={1.5} size={18} color={C.text.secondary} />
          ) : (
            <ChevronRight
              strokeWidth={1.5}
              size={18}
              color={C.text.secondary}
            />
          )}
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={s.subjectName}>{m.name}</Text>
            {width < 700 && (
              <Text style={[ui.small, { fontSize: 11 }]}>
                {count}/{m.evaluations.length} publiée{count > 1 ? "s" : ""} ·
                Coeff. {m.coeff_matiere}
              </Text>
            )}
          </View>
        </View>
        {width >= 700 && (
          <>
            <Text style={[ui.small, s.published]}>
              {count}/{m.evaluations.length} publiées
            </Text>
            <Text style={[ui.small, s.coeff]}>Coeff. {m.coeff_matiere}</Text>
          </>
        )}
        <Text
          style={[
            s.subjectAverage,
            m.moyenne != null && m.moyenne < 6 && { color: C.status.error },
          ]}
        >
          {fmt(m.moyenne)}
        </Text>
      </Pressable>
      {expanded && (
        <MatiereCard
          evaluationData={m.evaluations}
          simulatedNotes={simulatedNotes}
          updateSimulation={updateSimulation}
          readOnly={readOnly}
        />
      )}
    </View>
  );
}
const s = StyleSheet.create({
  ueHeader: {
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: C.surfaceMuted,
  },
  ueTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: C.text.primary,
    lineHeight: 21,
  },
  ueAverage: {
    fontSize: 26,
    fontVariant: ["tabular-nums"],
    color: C.text.primary,
  },
  subject: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    minHeight: 64,
    borderTopWidth: 1,
    borderTopColor: C.divider,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  subjectName: { fontSize: 14, color: C.text.primary, lineHeight: 20 },
  subjectAverage: {
    width: 60,
    textAlign: "right",
    fontVariant: ["tabular-nums"],
    fontSize: 17,
    fontWeight: "500",
    color: C.text.primary,
  },
  published: { width: 105, textAlign: "right" },
  coeff: { width: 85, textAlign: "right" },
});

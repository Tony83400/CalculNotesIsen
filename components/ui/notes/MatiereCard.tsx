import React, { useState } from "react";
import { Text, View, StyleSheet, TextInput } from "react-native";
import Slider from "@react-native-community/slider";
import type { Evaluations } from "../../../types/note";
import { parseGrade } from "../../../utils/notes";
import { Colors as C } from "../../../constants/Colors";
import { Badge, Button, ui } from "../Primitives";
interface Props {
  evaluationData: Evaluations[];
  simulatedNotes: Record<string, number | null>;
  updateSimulation: (id: string, value: number | null) => void;
  readOnly?: boolean;
}
export default function MatiereCard({
  evaluationData,
  simulatedNotes,
  updateSimulation,
  readOnly = false,
}: Props) {
  return (
    <View>
      {evaluationData.map((e) => (
        <Evaluation
          key={e.uniqueId}
          item={e}
          simulated={simulatedNotes[e.uniqueId!] != null}
          update={(v) => updateSimulation(e.uniqueId!, v)}
          readOnly={readOnly}
        />
      ))}
    </View>
  );
}
function Evaluation({
  item: e,
  simulated,
  update,
  readOnly,
}: {
  item: Evaluations;
  simulated: boolean;
  update: (v: number | null) => void;
  readOnly: boolean;
}) {
  const [editing, setEditing] = useState(false),
    [text, setText] = useState(""),
    [error, setError] = useState(""),
    [slider, setSlider] = useState(10);
  const begin = () => {
    setText(e.noteReelle == null ? "" : String(e.noteReelle).replace(".", ","));
    setSlider(e.noteReelle ?? 10);
    setError("");
    setEditing(true);
  };
  const apply = () => {
    const v = parseGrade(text);
    if (v === null) {
      setError("Entrez une note de 0 à 20, avec au plus deux décimales.");
      return;
    }
    update(v);
    setEditing(false);
    setError("");
  };
  return (
    <View style={s.evaluation}>
      <View style={[ui.row, { alignItems: "flex-start", flexWrap: "wrap" }]}>
        <View style={{ flex: 1, minWidth: 160, gap: 8 }}>
          <Text style={s.name}>{e.name}</Text>
          <View style={ui.wrap}>
            <Text style={ui.small}>Coeff. {e.coeff}</Text>
            <Badge
              tone={
                e.source === "simulation"
                  ? "info"
                  : e.source === "retake"
                    ? "warning"
                    : "neutral"
              }
            >
              {e.source === "simulation"
                ? "Simulée"
                : e.source === "retake"
                  ? "Rattrapage appliqué"
                  : e.hasApiNote
                    ? "Publiée"
                    : "En attente"}
            </Badge>
          </View>
          {(simulated || e.source === "retake") && (
            <Text style={ui.small}>
              Source publiée :{" "}
              {e.publishedNote == null
                ? "—"
                : e.publishedNote.toLocaleString("fr-FR")}{" "}
              / 20
            </Text>
          )}
        </View>
        <Text
          style={[
            s.value,
            e.source === "simulation" && { color: C.status.info },
          ]}
        >
          {e.noteReelle == null
            ? "—"
            : e.noteReelle.toLocaleString("fr-FR", {
                minimumFractionDigits: 2,
              })}
          <Text style={ui.small}> / 20</Text>
        </Text>
        {!readOnly && (
          <Button
            label="Simuler"
            accessibilityLabel={`Simuler ${e.name}`}
            variant="quiet"
            onPress={begin}
          />
        )}
      </View>
      {simulated && !editing && (
        <View style={{ alignSelf: "flex-end" }}>
          <Button
            label="Retirer la simulation"
            accessibilityLabel={`Retirer la simulation pour ${e.name}`}
            variant="quiet"
            onPress={() => update(null)}
          />
        </View>
      )}
      {editing && (
        <View style={s.editor}>
          <Text style={s.name}>Hypothèse pour cette évaluation</Text>
          <View style={[ui.row, { flexWrap: "wrap" }]}>
            <TextInput
              accessibilityLabel={`Note simulée pour ${e.name}`}
              style={s.input}
              value={text}
              onChangeText={(v) => {
                setText(v);
                setError("");
                const n = parseGrade(v);
                if (n !== null) setSlider(n);
              }}
              keyboardType="decimal-pad"
              inputMode="decimal"
              returnKeyType="done"
              autoFocus
              selectTextOnFocus
              onSubmitEditing={apply}
            />
            <Text style={ui.small}>/ 20</Text>
            <Button
              label="Appliquer"
              accessibilityLabel={`Appliquer la simulation pour ${e.name}`}
              variant="primary"
              onPress={apply}
            />
            <Button
              label="Annuler"
              variant="quiet"
              onPress={() => {
                setEditing(false);
                setError("");
              }}
            />
          </View>
          {error && (
            <Text
              accessibilityRole="alert"
              style={{ color: C.status.error, fontSize: 13 }}
            >
              {error}
            </Text>
          )}
          <Slider
            accessibilityLabel={`Curseur de simulation pour ${e.name}`}
            accessibilityValue={{
              min: 0,
              max: 20,
              now: slider,
              text: `${slider} sur 20`,
            }}
            style={{ height: 44, width: "100%", maxWidth: 480 }}
            minimumValue={0}
            maximumValue={20}
            step={0.1}
            value={slider}
            onValueChange={(v) => {
              setSlider(v);
              setText(v.toFixed(1).replace(".", ","));
            }}
            minimumTrackTintColor={C.primary}
            maximumTrackTintColor={C.border}
            thumbTintColor={C.primary}
          />
          <Text style={ui.small}>
            L’hypothèse modifie uniquement les estimations de l’application.
          </Text>
        </View>
      )}
    </View>
  );
}
const s = StyleSheet.create({
  evaluation: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: C.divider,
    backgroundColor: C.surfaceSubtle,
    gap: 8,
  },
  name: { fontSize: 14, color: C.text.primary },
  value: {
    fontSize: 18,
    fontVariant: ["tabular-nums"],
    fontWeight: "500",
    color: C.text.primary,
    paddingVertical: 8,
  },
  editor: { gap: 12, paddingVertical: 12 },
  input: {
    width: 90,
    minHeight: 44,
    borderWidth: 1,
    borderColor: C.primary,
    borderRadius: 6,
    padding: 12,
    fontSize: 18,
    fontVariant: ["tabular-nums"],
    color: C.text.primary,
    backgroundColor: C.surface,
  },
});

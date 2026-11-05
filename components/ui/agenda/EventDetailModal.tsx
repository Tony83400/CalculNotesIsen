import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from "react-native";
import type { AgendaEvent, EventDetails } from "../../../types/agenda";
import { Colors as C } from "../../../constants/Colors";
import { Theme } from "../../../constants/Theme";
import { formatFullDate, formatTime } from "../../../utils/agenda";
import { getEventIdByTime, getEventDetails } from "../../../services/isenApi";
import { useAppData } from "../../../providers/AppData";
import { Badge, Body, Button, ui } from "../Primitives";
interface Props {
  event: AgendaEvent | null;
  visible: boolean;
  onClose: () => void;
  hideDetails?: boolean;
}
export default function EventDetailModal({
  event,
  visible,
  onClose,
  hideDetails = false,
}: Props) {
  const app = useAppData(),
    [details, setDetails] = useState<EventDetails | null>(null),
    [loading, setLoading] = useState(false),
    [message, setMessage] = useState("");
  const closeRef = useRef<View>(null);
  const personal = !hideDetails && !event?.userName && !app.demo;
  useEffect(() => {
    const abort = new AbortController();
    setDetails(null);
    setMessage("");
    setLoading(false);
    if (!visible || !event || !personal) return () => abort.abort();
    setLoading(true);
    void (async () => {
      try {
        const id = await getEventIdByTime(
          +event.start,
          +event.end,
          abort.signal,
        );
        const data = id ? await getEventDetails(id, abort.signal) : null;
        if (!abort.signal.aborted) {
          setDetails(data);
          if (!data)
            setMessage(
              "Aucun cours personnel identifié avec certitude à cet horaire.",
            );
        }
      } catch {
        if (!abort.signal.aborted)
          setMessage("Les détails personnels ne sont pas disponibles.");
      } finally {
        if (!abort.signal.aborted) setLoading(false);
      }
    })();
    return () => abort.abort();
  }, [visible, event, personal]);
  useEffect(() => {
    if (visible && Platform.OS === "web") {
      const previous = document.activeElement as HTMLElement | null;
      const key = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      };
      document.addEventListener("keydown", key);
      return () => {
        document.removeEventListener("keydown", key);
        previous?.focus();
      };
    }
  }, [visible, onClose]);
  if (!event) return null;
  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      onShow={() => {
        (closeRef.current as (View & { focus?: () => void }) | null)?.focus?.();
      }}
    >
      <View style={s.overlay}>
        <Pressable
          accessibilityLabel="Fermer les détails"
          accessibilityRole="button"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
        <View accessibilityViewIsModal style={s.dialog}>
          <View
            style={[
              ui.row,
              {
                justifyContent: "space-between",
                padding: 24,
                borderBottomWidth: 1,
                borderBottomColor: C.border,
              },
            ]}
          >
            <Badge tone={event.isExam ? "warning" : "success"}>
              {event.userName || (event.isExam ? "Examen" : "Cours")}
            </Badge>
            <Pressable
              ref={closeRef}
              accessibilityRole="button"
              accessibilityLabel="Fermer les détails du cours"
              onPress={onClose}
              style={{
                minHeight: 44,
                minWidth: 70,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: C.primary, fontWeight: "500" }}>
                Fermer
              </Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={{ padding: 24, gap: 24 }}>
            <Text accessibilityRole="header" style={s.title}>
              {event.title}
            </Text>
            <View style={{ gap: 4 }}>
              <Text style={ui.label}>Horaire</Text>
              <Body>{formatFullDate(event.start)}</Body>
              <Body>
                {formatTime(event.start)} →{" "}
                {event.start.toDateString() !== event.end.toDateString()
                  ? formatFullDate(event.end) + " · "
                  : ""}
                {formatTime(event.end)}
              </Body>
            </View>
            <View style={{ gap: 4 }}>
              <Text style={ui.label}>Lieu</Text>
              <Body>{event.location}</Body>
            </View>
            {event.userName ? (
              <Text style={ui.small}>
                Comparaison des horaires uniquement. Les détails personnels de
                ce cours ne sont pas recherchés avec votre session.
              </Text>
            ) : app.demo ? (
              <Text style={ui.small}>
                Cours fictif de démonstration. Aucun appel à l’API personnelle.
              </Text>
            ) : loading ? (
              <View style={ui.row}>
                <ActivityIndicator color={C.primary} />
                <Text style={ui.small}>Recherche des détails personnels…</Text>
              </View>
            ) : details ? (
              <>
                <Detail
                  label="Module"
                  value={details.module || details.courseName}
                />
                <Detail
                  label="Enseignants"
                  value={details.teachers?.join(", ")}
                />
                <Detail label="Groupes" value={details.groups?.join(", ")} />
                <Detail label="Type" value={details.type} />
                <Detail label="Statut" value={details.status} />
                <Detail
                  label="Étudiants"
                  value={
                    details.students.length
                      ? details.students.join(", ")
                      : "Non précisé"
                  }
                />
                <Detail label="Salles" value={details.rooms?.join(", ")} />
              </>
            ) : (
              <Text style={ui.small}>
                {message || "Détails non disponibles."}
              </Text>
            )}
            <Button label="Revenir à l’agenda" onPress={onClose} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
function Detail({ label, value }: { label: string; value?: string }) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={ui.label}>{label}</Text>
      <Body>{value || "Non précisé"}</Body>
    </View>
  );
}
const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: C.overlay,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  dialog: {
    width: "100%",
    maxWidth: 520,
    maxHeight: "90%",
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
    overflow: "hidden",
  },
  title: {
    fontSize: 26,
    fontFamily: Theme.font.heading,
    color: C.text.primary,
    lineHeight: 34,
  },
});

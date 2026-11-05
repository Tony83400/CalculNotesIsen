import { themedStyles } from "../../../constants/themedStyles";
import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import type { AgendaEvent } from "../../../types/agenda";
import { eventsOnDay, formatTime } from "../../../utils/agenda";
import { Colors as C } from "../../../constants/Colors";
import { Badge, Empty, ui } from "../Primitives";
import EventDetailModal from "./EventDetailModal";
interface Props {
  events: AgendaEvent[];
  selectedDate: Date;
  scrollEnabled?: boolean;
  hideDetails?: boolean;
}
export default function DailyAgenda({
  events,
  selectedDate,
  hideDetails = false,
}: Props) {
  const [chosen, setChosen] = useState<AgendaEvent | null>(null);
  const day = eventsOnDay(events, selectedDate).sort(
    (a, b) => +a.start - +b.start,
  );
  if (!day.length)
    return (
      <Empty
        title="Aucun cours ce jour"
        detail="Aucun événement disponible pour cette date."
      />
    );
  return (
    <View style={{ gap: 12 }}>
      {day.map((e) => {
        const collision = day.some(
          (o) => o.id !== e.id && o.start < e.end && o.end > e.start,
        );
        return (
          <Pressable
            key={e.id}
            accessibilityRole="button"
            accessibilityLabel={`${formatTime(e.start)} à ${formatTime(e.end)}, ${e.title}, ${e.location}${e.userName ? ", " + e.userName : ""}`}
            onPress={() => setChosen(e)}
            style={[
              s.event,
              e.isExam && { backgroundColor: "#FFCE38" },
              {
                borderLeftColor:
                  e.color || (e.isExam ? C.status.warning : C.primary),
              },
            ]}
          >
            <View style={s.time}>
              <Text style={[s.start, e.isExam && { color: "#492700" }]}>
                {formatTime(e.start)}
              </Text>
              <Text style={[ui.small, e.isExam && { color: "#492700" }]}>
                {formatTime(e.end)}
              </Text>
            </View>
            <View style={{ flex: 1, minWidth: 0, gap: 8 }}>
              <View style={ui.wrap}>
                {e.isExam && (
                  <Text
                    style={{
                      backgroundColor: "#492700",
                      color: "#FFFFFF",
                      padding: 4,
                      fontSize: 11,
                    }}
                  >
                    Examen
                  </Text>
                )}
                {e.userName && (
                  <Text
                    style={[ui.small, { color: e.color, fontWeight: "500" }]}
                  >
                    {e.userName}
                  </Text>
                )}
                {collision && <Badge tone="info">En simultané</Badge>}
              </View>
              <Text style={[s.title, e.isExam && { color: "#492700" }]}>
                {e.title}
              </Text>
              <Text style={[ui.small, e.isExam && { color: "#492700" }]}>
                {e.location}
              </Text>
              {e.start.toDateString() !== e.end.toDateString() && (
                <Text style={ui.small}>Événement sur plusieurs jours</Text>
              )}
            </View>
            <Text style={{ color: C.text.secondary, fontSize: 21 }}>›</Text>
          </Pressable>
        );
      })}
      <EventDetailModal
        event={chosen}
        visible={!!chosen}
        onClose={() => setChosen(null)}
        hideDetails={hideDetails}
      />
    </View>
  );
}
const s = themedStyles(() => ({
  event: {
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
    padding: 16,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderLeftWidth: 4,
    borderRadius: 6,
    minHeight: 96,
  },
  time: { width: 64, gap: 8, alignSelf: "flex-start" },
  start: {
    fontSize: 18,
    fontVariant: ["tabular-nums"],
    color: C.text.primary,
    fontWeight: "500",
  },
  title: {
    fontSize: 15,
    fontWeight: "500",
    color: C.text.primary,
    lineHeight: 22,
  },
}));

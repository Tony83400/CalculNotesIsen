import React, { useMemo, useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import type { AgendaEvent } from "../../../types/agenda";
import {
  addDays,
  dayStart,
  layoutDay,
  formatTime,
  minutesInDay,
} from "../../../utils/agenda";
import { Colors as C } from "../../../constants/Colors";
import { ui } from "../Primitives";
import EventDetailModal from "./EventDetailModal";
interface Props {
  events: AgendaEvent[];
  startDay: Date;
  viewMode?: "day" | "week";
  scrollEnabled?: boolean;
  hideDetails?: boolean;
}
const TIMES = 56;
export default function AgendaGrid({
  events,
  startDay,
  viewMode = "week",
  hideDetails = false,
}: Props) {
  const [containerWidth, setContainerWidth] = useState(350);
  const [chosen, setChosen] = useState<AgendaEvent | null>(null);
  const dayCount = viewMode === "day" ? 1 : 7;
  const hourHeight = viewMode === "day" ? 80 : 72;
  const firstDayTime = +dayStart(startDay);
  const days = useMemo(
    () =>
      Array.from({ length: dayCount }, (_, i) =>
        addDays(new Date(firstDayTime), i),
      ),
    [firstDayTime, dayCount],
  );
  const layout = useMemo(
    () => days.map((day) => layoutDay(events, day)),
    [events, days],
  );
  const minHour = Math.min(
    8,
    ...layout.flatMap((l, i) =>
      l.map((e) => Math.floor(minutesInDay(e.start, days[i]) / 60)),
    ),
  );
  const maxHour = Math.max(
    viewMode === "day" ? 20 : 19,
    ...layout.flatMap((l, i) =>
      l.map((e) => Math.ceil(minutesInDay(e.end, days[i]) / 60)),
    ),
  );
  const maxColumns = Math.max(
    1,
    ...layout.flatMap((l) => l.map((p) => p.columns)),
  );
  // Two simultaneous courses fit a phone. More lanes remain readable by scrolling
  // this container; a week always includes all seven days, including Sunday.
  const minimumWidth = viewMode === "week" ? 900 : TIMES + maxColumns * 132;
  const gridWidth = Math.max(containerWidth, minimumWidth);
  const dayWidth = (gridWidth - TIMES) / dayCount;
  const height = (maxHour - minHour) * hourHeight;
  const shortEvents = layout.flat().filter((p) => p.end - p.start < 3600000);
  return (
    <View
      testID="agenda-time-grid"
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
      style={[ui.panel, { overflow: "hidden" }]}
    >
      <ScrollView horizontal contentContainerStyle={{ width: gridWidth }}>
        <View style={{ width: gridWidth }}>
          <View style={s.header}>
            <View style={{ width: TIMES }} />
            {days.map((day) => {
              const today = day.toDateString() === new Date().toDateString();
              return (
                <View
                  key={+day}
                  testID="agenda-day-header"
                  accessibilityLabel={day.toLocaleDateString("fr-FR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                  style={[
                    s.dayHead,
                    { width: dayWidth },
                    today && { backgroundColor: C.primaryLight },
                  ]}
                >
                  <Text style={[s.dayName, today && { color: C.primary }]}>
                    {day.toLocaleDateString("fr-FR", {
                      weekday: viewMode === "day" ? "long" : "short",
                    })}
                  </Text>
                  <Text style={[s.dayDate, today && { color: C.primary }]}>
                    {day.getDate()}
                  </Text>
                  {today && (
                    <Text style={{ fontSize: 11, color: C.primary }}>
                      Aujourd’hui
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
          <View style={{ height, flexDirection: "row" }}>
            <View style={{ width: TIMES }}>
              {Array.from({ length: maxHour - minHour + 1 }, (_, i) => (
                <Text key={i} style={[s.hour, { top: i * hourHeight - 7 }]}>
                  {String(minHour + i).padStart(2, "0")}:00
                </Text>
              ))}
            </View>
            {days.map((day, di) => (
              <View
                key={+day}
                style={{
                  width: dayWidth,
                  borderLeftWidth: 1,
                  borderLeftColor: C.divider,
                  backgroundColor:
                    day.toDateString() === new Date().toDateString()
                      ? C.surfaceSubtle
                      : C.surface,
                }}
              >
                {Array.from({ length: maxHour - minHour }, (_, i) => (
                  <View
                    key={i}
                    style={{
                      position: "absolute",
                      top: i * hourHeight,
                      width: "100%",
                      height: 1,
                      backgroundColor: C.divider,
                    }}
                  />
                ))}
                {layout[di].map((p) => {
                  const top =
                    (minutesInDay(p.start, day) / 60 - minHour) * hourHeight;
                  const eventHeight =
                    ((minutesInDay(p.end, day) - minutesInDay(p.start, day)) /
                      60) *
                    hourHeight;
                  const color =
                    p.event.color ||
                    (p.event.isExam ? C.status.warning : C.primary);
                  const shared = !!p.event.userName;
                  const showRoom = eventHeight >= (shared ? 104 : 80);
                  const titleLines = Math.max(
                    1,
                    Math.floor(
                      (eventHeight - (shared ? 92 : 56)) /
                        (viewMode === "day" ? 18 : 16),
                    ),
                  );
                  return (
                    <Pressable
                      key={p.event.id}
                      testID={`agenda-event-${p.event.id}`}
                      accessibilityRole="button"
                      accessibilityLabel={`${p.event.userName || ""} ${p.event.title}, ${formatTime(p.event.start)} à ${formatTime(p.event.end)}, ${p.event.location}`}
                      onPress={() => setChosen(p.event)}
                      style={[
                        s.event,
                        {
                          top: Math.max(0, top) + 2,
                          height: Math.max(22, eventHeight - 4),
                          left: (p.column * dayWidth) / p.columns + 3,
                          width: dayWidth / p.columns - 6,
                          borderLeftColor: color,
                          backgroundColor: color + "13",
                          padding: eventHeight < 44 ? 4 : 8,
                        },
                      ]}
                    >
                      {shared && eventHeight >= 64 && (
                        <Text style={[s.owner, { color }]} numberOfLines={1}>
                          {p.event.userName}
                        </Text>
                      )}
                      {!shared && (
                        <Text
                          style={[s.eventTime, { color }]}
                          numberOfLines={1}
                        >
                          {formatTime(p.event.start)}
                          {eventHeight > 40
                            ? ` – ${formatTime(p.event.end)}`
                            : ""}
                        </Text>
                      )}
                      {eventHeight > (shared ? 64 : 30) && (
                        <Text
                          style={[
                            s.eventTitle,
                            viewMode === "day" && {
                              fontSize: 13,
                              lineHeight: 18,
                            },
                          ]}
                          numberOfLines={titleLines}
                        >
                          {p.event.isExam &&
                          !/exam|partiel/i.test(p.event.title)
                            ? "Examen · "
                            : ""}
                          {p.event.title}
                        </Text>
                      )}
                      {shared && (
                        <View style={s.sharedDetails}>
                          <Text
                            style={[s.eventTime, { color }]}
                            numberOfLines={1}
                          >
                            {formatTime(p.event.start)}
                            {eventHeight > 40
                              ? ` – ${formatTime(p.event.end)}`
                              : ""}
                          </Text>
                          {showRoom && (
                            <Text style={s.eventMeta} numberOfLines={2}>
                              {p.event.location}
                            </Text>
                          )}
                        </View>
                      )}
                      {!shared && showRoom && (
                        <Text style={s.eventMeta} numberOfLines={2}>
                          {p.event.location}
                        </Text>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
      <View
        style={{
          padding: 12,
          borderTopWidth: 1,
          borderTopColor: C.border,
          gap: 8,
        }}
      >
        {gridWidth > containerWidth + 1 && (
          <Text style={ui.small}>
            Faites défiler horizontalement pour voir{" "}
            {viewMode === "week"
              ? "les sept jours"
              : "tous les cours simultanés"}
            .
          </Text>
        )}
        <Text style={ui.small}>
          {hideDetails
            ? "Les cours simultanés sont affichés côte à côte. Sélectionnez un cours pour lire ses horaires et sa salle."
            : "Sélectionnez un cours pour ses détails."}
        </Text>
        {shortEvents.length > 0 && (
          <Text style={ui.small}>Cours courts · accès détaillé</Text>
        )}
        {shortEvents.map((p) => (
          <Pressable
            key={`${p.event.id}:${p.start}`}
            accessibilityRole="button"
            onPress={() => setChosen(p.event)}
            style={{ minHeight: 44, justifyContent: "center" }}
          >
            <Text style={ui.small}>
              {p.event.start.toLocaleDateString("fr-FR", { weekday: "short" })}{" "}
              · {formatTime(p.event.start)} ·{" "}
              {p.event.userName ? `${p.event.userName} · ` : ""}
              {p.event.title}
            </Text>
          </Pressable>
        ))}
      </View>
      <EventDetailModal
        event={chosen}
        visible={!!chosen}
        onClose={() => setChosen(null)}
        hideDetails={hideDetails}
      />
    </View>
  );
}
const s = StyleSheet.create({
  header: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    backgroundColor: C.surfaceMuted,
  },
  dayHead: {
    alignItems: "center",
    paddingVertical: 12,
    gap: 4,
    borderLeftWidth: 1,
    borderLeftColor: C.divider,
    minHeight: 80,
  },
  dayName: { fontSize: 11, color: C.text.secondary },
  dayDate: {
    fontSize: 22,
    fontVariant: ["tabular-nums"],
    color: C.text.primary,
  },
  hour: {
    position: "absolute",
    left: 4,
    fontSize: 11,
    color: C.text.secondary,
    fontVariant: ["tabular-nums"],
  },
  event: {
    position: "absolute",
    borderLeftWidth: 3,
    borderRadius: 4,
    overflow: "hidden",
  },
  owner: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "500",
    textTransform: "capitalize",
    marginBottom: 4,
  },
  eventTime: {
    fontSize: 11,
    lineHeight: 14,
    fontVariant: ["tabular-nums"],
    fontWeight: "500",
    marginBottom: 4,
  },
  eventTitle: {
    fontSize: 11,
    fontWeight: "500",
    lineHeight: 16,
    color: C.text.primary,
  },
  eventMeta: { fontSize: 11, lineHeight: 14, color: C.text.secondary },
  sharedDetails: { marginTop: "auto", paddingTop: 4 },
});

import React from "react";
import { View, Text, useWindowDimensions } from "react-native";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { Button, ui } from "../Primitives";
import { Colors as C } from "../../../constants/Colors";
import type { useCalendarNavigation } from "../../../hooks/useCalendarNavigation";
export default function CalendarToolbar({
  calendar: c,
  allowWeekOnMobile = false,
}: {
  calendar: ReturnType<typeof useCalendarNavigation>;
  allowWeekOnMobile?: boolean;
}) {
  const { width } = useWindowDimensions();
  return (
    <View
      style={[ui.wrap, { justifyContent: "space-between", marginBottom: 20 }]}
    >
      <View style={ui.wrap}>
        <Button label="Aujourd’hui" onPress={c.today} />
        <Button
          label="Période précédente"
          iconOnly
          icon={<ChevronLeft strokeWidth={1.5} size={18} color={C.primary} />}
          onPress={() => c.changeDate(c.viewMode === "week" ? -7 : -1)}
        />
        <Button
          label="Période suivante"
          iconOnly
          icon={<ChevronRight strokeWidth={1.5} size={18} color={C.primary} />}
          onPress={() => c.changeDate(c.viewMode === "week" ? 7 : 1)}
        />
      </View>
      <Text
        accessibilityRole="header"
        accessibilityLiveRegion="polite"
        style={{ fontSize: 15, fontWeight: "500", color: C.text.primary }}
      >
        {c.viewMode === "day"
          ? c.selectedDate.toLocaleDateString("fr-FR", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })
          : `${c.currentDay.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} — ${c.endOfWeek.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}`}
      </Text>
      {allowWeekOnMobile ? (
        <View style={ui.wrap}>
          <Button
            label="Jour"
            selected={c.viewMode === "day"}
            variant={c.viewMode === "day" ? "primary" : "default"}
            onPress={() => c.setViewMode("day")}
          />
          <Button
            label="Semaine"
            selected={c.viewMode === "week"}
            variant={c.viewMode === "week" ? "primary" : "default"}
            onPress={() => c.setViewMode("week")}
          />
        </View>
      ) : (
        width >= 700 && (
          <Button
            label={c.viewMode === "week" ? "Vue jour" : "Vue semaine"}
            onPress={c.toggleViewMode}
          />
        )
      )}
    </View>
  );
}

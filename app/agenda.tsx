import React from "react";
import { View } from "react-native";
import { RefreshCw } from "lucide-react-native";
import AppShell, { RouteLink } from "../components/AppShell";
import { useAppData } from "../providers/AppData";
import { useCalendarNavigation } from "../hooks/useCalendarNavigation";
import CalendarToolbar from "../components/ui/agenda/CalendarToolbar";
import AgendaGrid from "../components/ui/agenda/AgendaGrid";
import DailyAgenda from "../components/ui/agenda/DailyAgenda";
import { Button, ResourceStatus, ui } from "../components/ui/Primitives";
import { Colors as C } from "../constants/Colors";
export default function Agenda() {
  const app = useAppData(),
    calendar = useCalendarNavigation();
  return (
    <AppShell
      title="Mon agenda"
      kicker="Emploi du temps"
      actions={<RouteLink label="Comparer les agendas" to="/multi-agenda" />}
    >
      <CalendarToolbar calendar={calendar} />
      <View
        style={[ui.wrap, { justifyContent: "space-between", marginBottom: 20 }]}
      >
        <ResourceStatus {...app.agenda} demo={app.demo} />
        <Button
          label="Actualiser"
          loading={app.agenda.status === "loading"}
          icon={<RefreshCw strokeWidth={1.5} size={18} color={C.primary} />}
          onPress={() => void app.refresh()}
        />
      </View>
      {calendar.viewMode === "week" ? (
        <AgendaGrid events={app.agenda.data} startDay={calendar.currentDay} />
      ) : (
        <DailyAgenda
          events={app.agenda.data}
          selectedDate={calendar.selectedDate}
        />
      )}
    </AppShell>
  );
}

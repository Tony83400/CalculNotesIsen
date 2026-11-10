import React from "react";
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";
import {
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Loader2,
  RefreshCw,
} from "lucide-react-native";

import AgendaGrid from "../components/ui/agenda/AgendaGrid";
import DailyAgenda from "../components/ui/agenda/DailyAgenda";
import { Colors } from "../constants/Colors";
import { useAgenda } from "../hooks/useAgenda";

export default function AgendaScreen() {
  const {
    allEvents,
    weekEvents,
    loading,
    error,
    viewMode,
    currentDay,
    selectedDate,
    endOfWeek,
    changeDate,
    goToToday,
    toggleViewMode,
    refresh,
  } = useAgenda();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Barre unique compacte mobile-first */}
      <View style={styles.compactBar}>
        <TouchableOpacity
          onPress={() => router.push("/selection")}
          style={styles.backBtn}
          activeOpacity={0.7}
          accessibilityLabel="Retour"
        >
          <ArrowLeft size={20} color={Colors.text.primary} />
        </TouchableOpacity>

        <View style={styles.dateNav}>
          <TouchableOpacity
            onPress={() => changeDate(viewMode === "week" ? -7 : -1)}
            style={styles.navArrow}
            activeOpacity={0.7}
            accessibilityLabel="Période précédente"
          >
            <ChevronLeft size={18} color={Colors.text.secondary} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={goToToday}
            style={styles.dateCenterBtn}
            activeOpacity={0.7}
            accessibilityLabel="Revenir à aujourd'hui"
          >
            <Text
              style={styles.dateRangeText}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {viewMode === "week"
                ? `${currentDay.toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "short",
                  })} — ${endOfWeek.toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "short",
                  })}`
                : selectedDate.toLocaleDateString("fr-FR", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => changeDate(viewMode === "week" ? 7 : 1)}
            style={styles.navArrow}
            activeOpacity={0.7}
            accessibilityLabel="Période suivante"
          >
            <ChevronRight size={18} color={Colors.text.secondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.viewToggle}>
          <TouchableOpacity
            onPress={() => viewMode !== "day" && toggleViewMode()}
            style={[
              styles.toggleBtn,
              viewMode === "day" && styles.toggleBtnActive,
            ]}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.toggleBtnText,
                viewMode === "day" && styles.toggleBtnTextActive,
              ]}
            >
              Jour
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => viewMode !== "week" && toggleViewMode()}
            style={[
              styles.toggleBtn,
              viewMode === "week" && styles.toggleBtnActive,
            ]}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.toggleBtnText,
                viewMode === "week" && styles.toggleBtnTextActive,
              ]}
            >
              Sem.
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading && allEvents.length === 0 ? (
        <View style={styles.loaderContainer}>
          <Loader2 size={40} color={Colors.primary} style={styles.spinner} />
          <Text style={styles.loaderText}>Chargement de votre planning...</Text>
        </View>
      ) : error && allEvents.length === 0 ? (
        <View style={styles.loaderContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.refreshBtn} onPress={refresh}>
            <RefreshCw size={20} color="#FFF" />
            <Text style={styles.refreshBtnText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      ) : viewMode === "week" ? (
        <AgendaGrid events={weekEvents} startDay={currentDay} />
      ) : (
        <DailyAgenda events={allEvents} selectedDate={selectedDate} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  compactBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 6,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  dateNav: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.background,
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  navArrow: {
    padding: 6,
  },
  dateCenterBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  dateRangeText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.text.primary,
    textTransform: "capitalize",
    textAlign: "center",
  },
  viewToggle: {
    flexDirection: "row",
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  toggleBtn: {
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleBtnActive: {
    backgroundColor: Colors.primary,
  },
  toggleBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.text.secondary,
  },
  toggleBtnTextActive: {
    color: "#FFF",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  spinner: {
    marginBottom: 16,
  },
  loaderText: {
    fontSize: 15,
    color: Colors.text.secondary,
    fontWeight: "500",
  },
  errorText: {
    fontSize: 15,
    color: Colors.status.error,
    fontWeight: "600",
    marginBottom: 20,
    textAlign: "center",
  },
  refreshBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  refreshBtnText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 15,
  },
});

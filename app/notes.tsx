import React, { useState } from "react";
import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
  Animated,
  useWindowDimensions,
} from "react-native";
import { router } from "expo-router";
import {
  Home,
  AlertCircle,
  Loader2,
  TrendingUp,
  Trophy,
  CalendarDays,
  ChevronDown,
  Check,
} from "lucide-react-native";

import getDonneesAvecNotes from "../utils/notes";
import UeCard from "../components/ui/notes/UeList";
import { Colors } from "../constants/Colors";
import { useAppData } from "../providers/AppData";
import { useSpinAnimation } from "../hooks/useSpinAnimation";

export default function NotesScreen() {
  const app = useAppData();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;

  const [isRattrapageMode, setIsRattrapageMode] = useState(false);
  const [showSemesterPicker, setShowSemesterPicker] = useState(false);

  const isLoading = app.notes.status === "loading" && app.notes.data.length === 0;
  const isRefreshing = app.notes.status === "loading" && app.notes.data.length > 0;

  const spin = useSpinAnimation(isLoading, 1200);
  const refreshSpin = useSpinAnimation(isRefreshing, 1000);

  if (app.notes.error && app.notes.data.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <AlertCircle size={48} color={Colors.status.error} />
          <Text style={styles.errorTitle}>Erreur de chargement</Text>
          <Text style={styles.errorMessage}>{app.notes.error}</Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push("/selection")}
          >
            <Home size={20} color="#FFF" />
            <Text style={styles.primaryButtonText}>Retour à l'accueil</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <Loader2 size={48} color={Colors.primary} />
          </Animated.View>
          <Text style={styles.loadingTitle}>Récupération de vos notes...</Text>
          <Text style={styles.loadingSubtitle}>
            Initialisation de votre cursus en cours
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const selectedSemester = app.semester || Object.keys(app.majors)[0];
  const currentMajor = selectedSemester ? app.majors[selectedSemester] : null;
  const configActuelle = selectedSemester ? app.configs[selectedSemester] : null;
  const dataFiliere = configActuelle || [];

  const resultats = getDonneesAvecNotes(
    dataFiliere,
    app.notes.data,
    app.simulations,
    isRattrapageMode,
    selectedSemester,
  );
  const donneesAffichables = resultats.structure;
  const stats = resultats.stats;
  const availableSemesters = Object.keys(app.majors).sort();

  const getMoyenneColor = (moy: number | null | undefined) => {
    if (moy === null || moy === undefined) return Colors.text.tertiary;
    if (moy >= 10) return Colors.status.success;
    if (moy >= 8) return Colors.status.warning;
    return Colors.status.error;
  };

  const formattedDate = app.notes.updatedAt
    ? new Date(app.notes.updatedAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  const flatListData =
    isDesktop && donneesAffichables.length % 2 !== 0
      ? [...donneesAffichables, { ue: "__spacer__", isSpacer: true } as any]
      : donneesAffichables;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* TOP BAR / NAVIGATION */}
      <View style={styles.headerWrapper}>
        <View style={[styles.topHeader, isDesktop && styles.topHeaderDesktop]}>
          <TouchableOpacity
            onPress={() => router.push("/selection")}
            style={styles.iconBtn}
            activeOpacity={0.7}
          >
            <Home size={22} color={Colors.text.primary} />
          </TouchableOpacity>

          <View style={styles.headerTitleContainer}>
            <TouchableOpacity
              style={styles.semesterToggle}
              onPress={() => setShowSemesterPicker(!showSemesterPicker)}
              activeOpacity={0.7}
            >
              <Text
                style={styles.headerTitle}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {selectedSemester} - {currentMajor}
              </Text>
              <ChevronDown size={16} color={Colors.text.tertiary} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => router.replace("/agenda")}
            style={styles.iconBtn}
            activeOpacity={0.7}
          >
            <CalendarDays size={22} color={Colors.text.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* MODAL SEMESTER PICKER */}
      {showSemesterPicker && (
        <View style={styles.semesterPickerMenu}>
          {availableSemesters.map((sem) => (
            <TouchableOpacity
              key={sem}
              style={[
                styles.semesterPickerItem,
                selectedSemester === sem && styles.semesterPickerItemActive,
              ]}
              onPress={() => {
                app.selectSemester(sem);
                setShowSemesterPicker(false);
              }}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.semesterPickerText,
                  selectedSemester === sem && styles.semesterPickerTextActive,
                ]}
              >
                {sem} ({app.majors[sem]})
              </Text>
              {selectedSemester === sem && (
                <Check size={18} color={Colors.primary} strokeWidth={2.5} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* CONTRÔLES : Sélecteur de Mode & Actualisation */}
      <View
        style={[
          styles.controlsContainer,
          isDesktop && styles.controlsContainerDesktop,
        ]}
      >
        <View
          style={[styles.modeSelector, isDesktop && styles.modeSelectorDesktop]}
        >
          <TouchableOpacity
            style={[styles.modeTab, !isRattrapageMode && styles.activeModeTab]}
            onPress={() => setIsRattrapageMode(false)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.modeTabText,
                !isRattrapageMode && styles.activeModeTabText,
              ]}
            >
              Standard
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeTab, isRattrapageMode && styles.activeModeTab]}
            onPress={() => setIsRattrapageMode(true)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.modeTabText,
                isRattrapageMode && styles.activeModeTabText,
              ]}
            >
              Rattrapage
            </Text>
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.refreshIndicatorContainer,
            isDesktop && styles.refreshIndicatorDesktop,
          ]}
        >
          <View style={styles.refreshInfoLeft}>
            {isRefreshing ? (
              <View style={styles.refreshingRow}>
                <Animated.View style={{ transform: [{ rotate: refreshSpin }] }}>
                  <Loader2 size={12} color={Colors.primary} />
                </Animated.View>
                <Text style={styles.refreshText}>Actualisation...</Text>
              </View>
            ) : (
              <TouchableOpacity onPress={() => app.refresh()} activeOpacity={0.7}>
                <Text style={styles.refreshText}>↻ Actualiser</Text>
              </TouchableOpacity>
            )}
          </View>
          {formattedDate && (
            <Text style={styles.lastUpdateText}>Mis à jour à {formattedDate}</Text>
          )}
        </View>
      </View>

      {/* LISTE DES UE & STATS */}
      <FlatList
        key={isDesktop ? "grid-2" : "list-1"}
        data={flatListData}
        numColumns={isDesktop ? 2 : 1}
        columnWrapperStyle={isDesktop ? styles.columnWrapper : undefined}
        keyExtractor={(item, index) => item.ue + index}
        ListHeaderComponent={
          <View style={[styles.statsRow, isDesktop && styles.statsRowDesktop]}>
            {/* CARTE MOYENNE */}
            <View style={styles.statCard}>
              <View style={styles.statHeader}>
                <View
                  style={[
                    styles.statIconContainer,
                    {
                      backgroundColor:
                        getMoyenneColor(stats.moyenne) + "12",
                    },
                  ]}
                >
                  <TrendingUp
                    size={18}
                    color={getMoyenneColor(stats.moyenne)}
                  />
                </View>
                <Text style={styles.statLabel}>Moyenne</Text>
              </View>
              <View style={styles.statValueRow}>
                <Text
                  style={[
                    styles.statValue,
                    { color: getMoyenneColor(stats.moyenne) },
                  ]}
                >
                  {stats.moyenne !== null && stats.moyenne !== undefined
                    ? stats.moyenne.toFixed(2)
                    : "--"}
                </Text>
                <Text style={styles.statMax}>/20</Text>
              </View>
            </View>

            {/* CARTE ECTS */}
            <View style={styles.statCard}>
              <View style={styles.statHeader}>
                <View
                  style={[
                    styles.statIconContainer,
                    { backgroundColor: Colors.primary + "12" },
                  ]}
                >
                  <Trophy size={18} color={Colors.primary} />
                </View>
                <Text style={styles.statLabel}>Crédits ECTS</Text>
              </View>
              <View style={styles.statValueRow}>
                <Text
                  style={[styles.statValue, { color: Colors.text.primary }]}
                >
                  {stats.ects}
                </Text>
                <Text style={styles.statMax}>/ {stats.totalEcts || 30}</Text>
              </View>
            </View>
          </View>
        }
        renderItem={({ item }) => {
          if ((item as any).isSpacer) {
            return <View style={styles.spacerCard} />;
          }
          return (
            <UeCard
              Ue={item}
              simulatedNotes={app.simulations}
              updateSimulation={app.updateSimulation}
              style={isDesktop ? styles.ueCardDesktop : undefined}
            />
          );
        }}
        contentContainerStyle={[
          styles.listContent,
          isDesktop && styles.listContentDesktop,
        ]}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerWrapper: {
    width: "100%",
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    zIndex: 10,
  },
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: 650,
    width: "100%",
    alignSelf: "center",
  },
  topHeaderDesktop: {
    maxWidth: 1200,
    paddingHorizontal: 24,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleContainer: { flex: 1, alignItems: "center", paddingHorizontal: 12 },
  semesterToggle: { flexDirection: "row", alignItems: "center", gap: 6 },
  headerTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: Colors.text.primary,
    letterSpacing: -0.3,
  },
  semesterPickerMenu: {
    position: "absolute",
    top: 70,
    left: 16,
    right: 16,
    maxWidth: 500,
    alignSelf: "center",
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    zIndex: 100,
  },
  semesterPickerItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 14,
  },
  semesterPickerItemActive: { backgroundColor: Colors.primary + "08" },
  semesterPickerText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.text.secondary,
  },
  semesterPickerTextActive: { color: Colors.primary, fontWeight: "700" },
  controlsContainer: {
    maxWidth: 650,
    width: "100%",
    alignSelf: "center",
    paddingTop: 12,
  },
  controlsContainerDesktop: {
    maxWidth: 1200,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  modeSelector: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    marginHorizontal: 16,
  },
  modeSelectorDesktop: {
    marginHorizontal: 0,
    width: 280,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  activeModeTab: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  modeTabText: { fontSize: 14, fontWeight: "700", color: Colors.text.secondary },
  activeModeTabText: { color: "#FFFFFF" },
  refreshIndicatorContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 0,
  },
  refreshIndicatorDesktop: {
    paddingHorizontal: 0,
    paddingTop: 0,
    gap: 16,
  },
  refreshInfoLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  refreshingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  refreshText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.text.tertiary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  lastUpdateText: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.text.tertiary,
  },
  listContent: {
    paddingBottom: 40,
    maxWidth: 650,
    width: "100%",
    alignSelf: "center",
  },
  listContentDesktop: {
    maxWidth: 1200,
    paddingHorizontal: 24,
  },
  columnWrapper: {
    gap: 20,
  },
  ueCardDesktop: {
    flex: 1,
    marginHorizontal: 0,
    marginBottom: 20,
  },
  spacerCard: {
    flex: 1,
    marginHorizontal: 0,
  },
  statsRow: {
    flexDirection: "row",
    gap: 16,
    padding: 16,
    paddingBottom: 24,
  },
  statsRowDesktop: {
    paddingHorizontal: 0,
    paddingBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2,
  },
  statHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  statLabel: { fontSize: 13, color: Colors.text.secondary, fontWeight: "700" },
  statValueRow: { flexDirection: "row", alignItems: "baseline" },
  statValue: { fontSize: 28, fontWeight: "800", letterSpacing: -1 },
  statMax: {
    fontSize: 14,
    color: Colors.text.tertiary,
    fontWeight: "600",
    marginLeft: 2,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.text.primary,
    textAlign: "center",
    marginTop: 24,
  },
  loadingSubtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: "center",
    marginTop: 8,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.text.primary,
    textAlign: "center",
    marginTop: 24,
  },
  errorMessage: {
    fontSize: 15,
    color: Colors.text.secondary,
    textAlign: "center",
    marginTop: 12,
    marginBottom: 32,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 10,
    width: "100%",
    justifyContent: "center",
  },
  primaryButtonText: { color: "white", fontSize: 16, fontWeight: "800" },
});

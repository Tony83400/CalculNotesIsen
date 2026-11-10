import React, { useState, useRef } from "react";
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import {
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Loader2,
  RefreshCw,
  Plus,
  X,
  Users,
  Info,
} from "lucide-react-native";

import AgendaGrid from "../components/ui/agenda/AgendaGrid";
import DailyAgenda from "../components/ui/agenda/DailyAgenda";
import { Colors } from "../constants/Colors";
import { useMultiAgenda } from "../hooks/useMultiAgenda";

export default function MultiAgendaScreen() {
  const {
    users,
    addUser,
    removeUser,
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
    searchError,
    setSearchError,
    recentUsers,
    removeRecentUser,
  } = useMultiAgenda();

  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [showAddDrawer, setShowAddDrawer] = useState(false);
  const nomInputRef = useRef<TextInput>(null);

  const handleAddUser = () => {
    if (prenom.trim() && nom.trim()) {
      addUser(prenom.trim(), nom.trim());
      setPrenom("");
      setNom("");
    }
  };

  const isDrawerOpen = showAddDrawer || users.length === 0;

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

      {/* Ligne compacte des étudiants avec bouton pour ouvrir/fermer le tiroir d'ajout */}
      <View style={styles.usersBar}>
        <TouchableOpacity
          style={[
            styles.toggleAddBtn,
            isDrawerOpen && styles.toggleAddBtnActive,
          ]}
          onPress={() => setShowAddDrawer((prev) => !prev)}
          activeOpacity={0.7}
          accessibilityLabel="Ajouter un étudiant"
        >
          {isDrawerOpen && users.length > 0 ? (
            <X size={15} color="#FFF" />
          ) : (
            <Plus size={15} color={isDrawerOpen ? "#FFF" : Colors.primary} />
          )}
          <Text
            style={[
              styles.toggleAddBtnText,
              isDrawerOpen && styles.toggleAddBtnTextActive,
            ]}
          >
            {users.length === 0 ? "Ajouter" : isDrawerOpen ? "Fermer" : "Ajouter"}
          </Text>
        </TouchableOpacity>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.usersScrollList}
        >
          {users.map((u) => (
            <View
              key={u.id}
              style={[
                styles.userBadge,
                {
                  borderColor: u.color + "40",
                  backgroundColor: u.color + "12",
                },
              ]}
            >
              <View
                style={[styles.userColorDot, { backgroundColor: u.color }]}
              />
              <Text style={[styles.userBadgeText, { color: u.color }]}>
                {u.prenom} {u.nom}
              </Text>
              <TouchableOpacity
                onPress={() => removeUser(u.id)}
                style={styles.removeUserBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityLabel={`Retirer ${u.prenom}`}
              >
                <X size={11} color={u.color} />
              </TouchableOpacity>
            </View>
          ))}
          {users.length === 0 && (
            <Text style={styles.noUserHint}>
              Aucun agenda affiché — ajoutez des étudiants à comparer
            </Text>
          )}
        </ScrollView>
      </View>

      {/* Tiroir d'ajout pliable (formulaire + récents) */}
      {isDrawerOpen && (
        <View style={styles.drawerContainer}>
          <View style={styles.addUserRow}>
            <TextInput
              style={styles.input}
              placeholder="Prénom"
              placeholderTextColor={Colors.text.tertiary}
              value={prenom}
              onChangeText={setPrenom}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="next"
              onSubmitEditing={() => nomInputRef.current?.focus()}
            />
            <TextInput
              ref={nomInputRef}
              style={styles.input}
              placeholder="Nom"
              placeholderTextColor={Colors.text.tertiary}
              value={nom}
              onChangeText={setNom}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleAddUser}
            />
            <TouchableOpacity
              style={[
                styles.addSubmitBtn,
                (!prenom.trim() || !nom.trim()) && styles.addSubmitBtnDisabled,
              ]}
              onPress={handleAddUser}
              disabled={!prenom.trim() || !nom.trim()}
              activeOpacity={0.7}
              accessibilityLabel="Valider l'ajout"
            >
              <Plus size={18} color="#FFF" />
            </TouchableOpacity>
          </View>

          {searchError && (
            <View style={styles.searchErrorBox}>
              <Info size={14} color={Colors.status.error} />
              <Text style={styles.searchErrorText}>{searchError}</Text>
              <TouchableOpacity onPress={() => setSearchError(null)}>
                <X size={14} color={Colors.status.error} />
              </TouchableOpacity>
            </View>
          )}

          {recentUsers.length > 0 && (
            <View style={styles.recentUsersRow}>
              <Text style={styles.recentUsersTitle}>Récents :</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.recentUsersList}
              >
                {recentUsers.map((u) => (
                  <TouchableOpacity
                    key={u.id}
                    style={styles.recentUserBadge}
                    onPress={() => addUser(u.prenom, u.nom)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.recentUserText}>
                      {u.prenom} {u.nom}
                    </Text>
                    <TouchableOpacity
                      style={styles.recentRemoveBtn}
                      onPress={() => removeRecentUser(u.id)}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <X size={9} color={Colors.text.tertiary} />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      )}

      {/* Contenu principal : Planning pleine hauteur */}
      <View style={styles.contentArea}>
        {loading && allEvents.length === 0 ? (
          <View style={styles.loaderContainer}>
            <Loader2
              size={36}
              color={Colors.primary}
              style={styles.spinner}
            />
            <Text style={styles.loaderText}>
              Chargement des emplois du temps...
            </Text>
          </View>
        ) : error && allEvents.length === 0 ? (
          <View style={styles.loaderContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.refreshBtn} onPress={refresh}>
              <RefreshCw size={18} color="#FFF" />
              <Text style={styles.refreshBtnText}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        ) : viewMode === "week" ? (
          <AgendaGrid
            events={weekEvents}
            startDay={currentDay}
            scrollEnabled={true}
          />
        ) : (
          <DailyAgenda
            events={allEvents}
            selectedDate={selectedDate}
            scrollEnabled={true}
          />
        )}
      </View>
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
  usersBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 8,
  },
  toggleAddBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary + "12",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.primary + "30",
  },
  toggleAddBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  toggleAddBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.primary,
  },
  toggleAddBtnTextActive: {
    color: "#FFF",
  },
  usersScrollList: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingRight: 10,
  },
  userBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingLeft: 8,
    paddingRight: 6,
    borderRadius: 14,
    borderWidth: 1,
    gap: 5,
    flexShrink: 0,
  },
  userColorDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  userBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  removeUserBtn: {
    padding: 2,
    backgroundColor: "#FFF",
    borderRadius: 8,
  },
  noUserHint: {
    fontSize: 11,
    color: Colors.text.tertiary,
    fontStyle: "italic",
    paddingVertical: 4,
  },
  drawerContainer: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    padding: 10,
    gap: 8,
  },
  addUserRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  input: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 13,
    color: Colors.text.primary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  addSubmitBtn: {
    backgroundColor: Colors.primary,
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  addSubmitBtnDisabled: {
    backgroundColor: Colors.text.tertiary,
    opacity: 0.5,
  },
  searchErrorBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.status.error + "10",
    padding: 8,
    borderRadius: 8,
    gap: 6,
  },
  searchErrorText: {
    flex: 1,
    fontSize: 12,
    color: Colors.status.error,
    fontWeight: "500",
  },
  recentUsersRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingTop: 2,
  },
  recentUsersTitle: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.text.tertiary,
    textTransform: "uppercase",
  },
  recentUsersList: {
    gap: 6,
    alignItems: "center",
  },
  recentUserBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 3,
    paddingLeft: 8,
    paddingRight: 4,
    borderRadius: 12,
    gap: 4,
  },
  recentUserText: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.text.secondary,
    textTransform: "capitalize",
  },
  recentRemoveBtn: {
    padding: 2,
  },
  contentArea: {
    flex: 1,
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
    fontSize: 14,
    color: Colors.text.secondary,
    fontWeight: "500",
    textAlign: "center",
  },
  errorText: {
    fontSize: 14,
    color: Colors.status.error,
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "center",
  },
  refreshBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  refreshBtnText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 14,
  },
});

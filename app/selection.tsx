import React from "react";
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import {
  GraduationCap,
  CalendarDays,
  ChevronRight,
  LogOut,
  Heart,
  Settings,
  Users,
} from "lucide-react-native";

import RefreshButton from "../components/ui/notes/RefreshButton";
import { Colors } from "../constants/Colors";
import { useAppData } from "../providers/AppData";

export default function SelectionScreen() {
  const app = useAppData();

  const handleLogout = async () => {
    await app.logout();
    router.replace("/");
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* HEADER : Bienvenue */}
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <Text style={styles.welcomeText}>
              Bonjour{app.user ? ` ${app.user.split(".")[0]}` : ""},
            </Text>
            <TouchableOpacity
              style={styles.settingsBtn}
              onPress={() => router.push("/selectionAnnee")}
              activeOpacity={0.7}
            >
              <Settings size={20} color={Colors.primary} />
            </TouchableOpacity>
          </View>
          <Text style={styles.title}>Tableau de bord</Text>
          {app.year && <Text style={styles.yearText}>{app.year}</Text>}
        </View>

        {/* CORPS : Fonctionnalités principales */}
        <View style={styles.mainContent}>
          <Text style={styles.sectionTitle}>Services académiques</Text>

          {/* Carte NOTES */}
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push("/selectionSemestre")}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.iconBox,
                { backgroundColor: Colors.primary + "10" },
              ]}
            >
              <GraduationCap size={32} color={Colors.primary} />
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitle}>Consulter mes notes</Text>
              <Text style={styles.cardDescription}>
                Choix du semestre, ECTS et moyennes
              </Text>
            </View>
            <View style={styles.arrowContainer}>
              <ChevronRight size={20} color={Colors.text.tertiary} />
            </View>
          </TouchableOpacity>

          {/* Carte AGENDA */}
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push("/agenda")}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.iconBox,
                { backgroundColor: Colors.status.warning + "10" },
              ]}
            >
              <CalendarDays size={32} color={Colors.status.warning} />
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitle}>Mon Agenda</Text>
              <Text style={styles.cardDescription}>
                Emploi du temps de la semaine
              </Text>
            </View>
            <View style={styles.arrowContainer}>
              <ChevronRight size={20} color={Colors.text.tertiary} />
            </View>
          </TouchableOpacity>

          {/* Carte MULTI-AGENDA */}
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push("/multi-agenda")}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.iconBox,
                { backgroundColor: Colors.status.info + "10" },
              ]}
            >
              <Users size={32} color={Colors.status.info} />
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitle}>Comparer les agendas</Text>
              <Text style={styles.cardDescription}>
                Superposer l'emploi du temps d'autres étudiants
              </Text>
            </View>
            <View style={styles.arrowContainer}>
              <ChevronRight size={20} color={Colors.text.tertiary} />
            </View>
          </TouchableOpacity>
        </View>

        {/* FOOTER : Actions et crédits */}
        <View style={styles.footer}>
          <View style={styles.actionRow}>
            <RefreshButton />
            <TouchableOpacity
              onPress={handleLogout}
              style={styles.logoutBtn}
              activeOpacity={0.7}
            >
              <LogOut size={18} color={Colors.status.error} />
              <Text style={styles.logoutText}>Déconnexion</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.creditsContainer}>
            <Text style={styles.versionText}>CalculNotesISEN v2.5</Text>
            <View style={styles.authorRow}>
              <Text style={styles.creditsText}>Fait avec </Text>
              <Heart
                size={10}
                color={Colors.status.error}
                fill={Colors.status.error}
              />
              <Text style={styles.creditsText}> par Anthony Coulais</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 32,
    maxWidth: 600,
    width: "100%",
    alignSelf: "center",
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  settingsBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  welcomeText: {
    fontSize: 16,
    color: Colors.text.secondary,
    fontWeight: "600",
    letterSpacing: -0.2,
  },
  title: {
    fontSize: 34,
    fontWeight: "800",
    color: Colors.text.primary,
    letterSpacing: -1,
    marginTop: 4,
  },
  yearText: {
    fontSize: 15,
    color: Colors.primary,
    fontWeight: "700",
    marginTop: 4,
    backgroundColor: Colors.primary + "10",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
  },
  mainContent: {
    paddingHorizontal: 16,
    maxWidth: 600,
    width: "100%",
    alignSelf: "center",
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: Colors.text.tertiary,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginLeft: 8,
    marginBottom: 16,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
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
    marginBottom: 12,
  },
  iconBox: {
    width: 60,
    height: 60,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: Colors.text.primary,
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  cardDescription: {
    fontSize: 13,
    color: Colors.text.secondary,
    fontWeight: "500",
  },
  arrowContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    marginTop: "auto",
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
    alignItems: "center",
    maxWidth: 600,
    width: "100%",
    alignSelf: "center",
  },
  actionRow: {
    alignSelf: "stretch",
    gap: 12,
    marginBottom: 24,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.status.error + "10",
    borderRadius: 16,
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  logoutText: {
    color: Colors.status.error,
    fontWeight: "700",
    fontSize: 14,
  },
  creditsContainer: {
    alignItems: "center",
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    width: "100%",
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  versionText: {
    color: Colors.text.primary,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  creditsText: {
    color: Colors.text.secondary,
    fontSize: 12,
    fontWeight: "500",
  },
});

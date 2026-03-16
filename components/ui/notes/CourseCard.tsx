import React from "react";
import { View, StyleSheet, Text } from "react-native";
import { MapPin, User, Clock } from "lucide-react-native";
import { Colors } from "@/constants/Colors";
import { AgendaEvent } from "@/types/agenda";

export default function CourseCard({ event }: { event: AgendaEvent }) {
  const isExam = event.isExam;

  return (
    <View style={[styles.card, isExam && styles.cardExam]}>
      {/* Barre d'accentuation plus fine et élégante */}
      <View
        style={[
          styles.accentBar,
          { backgroundColor: isExam ? Colors.status.error : Colors.primary },
        ]}
      />

      <View style={styles.cardContent}>
        {/* Section Temps : Alignement propre et moderne */}
        <View style={styles.timeSection}>
          <Text style={[styles.timeText, isExam && styles.examText]}>
            {event.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
          <View style={styles.timeDivider} />
          <Text style={styles.endTimeText}>
            {event.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>

        {/* Section Infos : Séparation visuelle plus discrète */}
        <View style={styles.infoSection}>
          <View style={styles.titleRow}>
            <Text style={styles.courseTitle} numberOfLines={2}>
              {event.title}
            </Text>
            {isExam && (
              <View style={styles.examBadge}>
                <Text style={styles.examBadgeText}>EXAMEN</Text>
              </View>
            )}
          </View>

          <View style={styles.detailsContainer}>
            <View style={styles.detailItem}>
              <MapPin size={12} color={isExam ? Colors.status.error : Colors.text.secondary} />
              <Text 
                style={[styles.detailText, isExam && { color: Colors.status.error }]} 
                numberOfLines={1}
              >
                {event.location || "Salle non définie"}
              </Text>
            </View>

            <View style={styles.detailItem}>
              <User size={12} color={isExam ? Colors.status.error : Colors.text.secondary} />
              <Text 
                style={[styles.detailText, isExam && { color: Colors.status.error }]} 
                numberOfLines={1}
              >
                {event.professors || "Non défini"}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderRadius: 12,
    marginBottom: 12,
    overflow: "hidden",
    // Ombre plus subtile (look moderne)
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardExam: {
    borderColor: Colors.status.error + "40", // 25% opacité rouge
    backgroundColor: Colors.status.error + "05", // 2% opacité rouge pour le fond
  },
  accentBar: {
    width: 4,
  },
  cardContent: {
    flex: 1,
    flexDirection: "row",
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  timeSection: {
    alignItems: "center",
    justifyContent: "center",
    width: 55,
    marginRight: 16,
  },
  timeText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text.primary,
    letterSpacing: -0.5,
  },
  timeDivider: {
    width: 1,
    height: 10,
    backgroundColor: Colors.divider,
    marginVertical: 4,
  },
  endTimeText: {
    fontSize: 12,
    color: Colors.text.secondary,
    fontWeight: "500",
  },
  examText: {
    color: Colors.status.error,
  },
  infoSection: {
    flex: 1,
    justifyContent: "center",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 8,
    gap: 8,
  },
  courseTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: Colors.text.primary,
    lineHeight: 20,
  },
  examBadge: {
    backgroundColor: Colors.status.error,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  examBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  detailsContainer: {
    flexDirection: "column",
    gap: 4,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detailText: {
    fontSize: 12,
    color: Colors.text.secondary,
    fontWeight: "400",
  },
});

import { Colors } from "@/constants/Colors";
import { AgendaEvent } from "@/types/agenda";
import { Ionicons } from "@expo/vector-icons";
import { View, StyleSheet, Text } from "react-native";

// Composant pour afficher un cours unique
export default function CourseCard({ event }: { event: AgendaEvent }) {
    // On vérifie si c'est un examen
    const isExam = event.isExam;

    return (
        <View style={[styles.card, isExam && styles.cardExamShadow]}>
            {/* Barre de couleur : Rouge si examen, Bleu (primaire) sinon */}
            <View style={[
                styles.accentBar,
                { backgroundColor: isExam ? Colors.status.error : Colors.primary }
            ]} />

            <View style={styles.cardContent}>
                <View style={styles.timeContainer}>
                    <Text style={[styles.timeText, isExam && styles.examTimeText]}>
                        {event.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                    <Text style={styles.timeSeparator}>|</Text>
                    <Text style={styles.endTimeText}>
                        {event.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>

                <View style={styles.infoContainer}>
                    {/* Conteneur Titre + Badge */}
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

                    <View style={styles.locationContainer}>
                        <Ionicons
                            name="location-sharp"
                            size={14}
                            color={isExam ? Colors.status.error : Colors.text.secondary}
                        />
                        <Text style={[styles.locationText, isExam && { color: Colors.status.error }]}>
                            {event.location || "Salle non définie"}
                        </Text>
                    </View>
                    <Text style={[styles.locationText, { marginTop: 4 }, isExam && { color: Colors.status.error }]}>
                        {event.professors}
                    </Text>
                </View>
            </View>
        </View>
    );
};


const styles = StyleSheet.create({
    // --- Card Style ---
    card: {
        flexDirection: 'row',
        backgroundColor: Colors.surface, // Use surface color
        borderRadius: 12,
        marginBottom: 16, // Consistent spacing
        overflow: 'hidden',
        // Modern iOS-like shadow
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 5,
    },
    accentBar: {
        width: 6, // Slightly thicker accent
    },
    cardContent: {
        flex: 1,
        flexDirection: 'row',
        padding: 16, // Consistent spacing
        alignItems: 'center',
    },

    // --- Time Section ---
    timeContainer: {
        marginRight: 16, // Consistent spacing
        alignItems: 'center',
        minWidth: 50,
    },
    timeText: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.text.primary, // Use theme color
    },
    timeSeparator: {
        fontSize: 10,
        color: Colors.border, // Use theme color
        marginVertical: 4,
    },
    endTimeText: {
        fontSize: 13,
        color: Colors.text.secondary, // Use theme color
    },

    // --- Info Section ---
    infoContainer: {
        flex: 1,
        borderLeftWidth: 1,
        borderLeftColor: Colors.border, // Use theme color
        paddingLeft: 16, // Consistent spacing
    },
    courseTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.text.primary, // Use theme color
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8, // Add space from title
    },
    locationText: {
        fontSize: 13,
        color: Colors.text.secondary, // Use theme color
        marginLeft: 6, // Space from icon
    },

    // --- Exam Variant ---
    cardExamShadow: {
        shadowColor: Colors.status.error, // Red shadow for emphasis
        shadowOpacity: 0.15,
        elevation: 6,
        // Removed background color to keep it clean
    },
    examTimeText: {
        color: Colors.status.error,
        fontWeight: '800',
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8, // Space between title and badge
    },
    examBadge: {
        backgroundColor: Colors.status.error,
        paddingHorizontal: 8,
        paddingVertical: 3, // Balanced padding
        borderRadius: 6, // Softer corners
    },
    examBadgeText: {
        color: Colors.text.inverse, // Use inverse text color
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
})
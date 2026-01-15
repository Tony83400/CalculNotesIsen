import { Colors } from "@/constants/Colors";
import { AgendaEvent } from "@/types/agenda";
import { Ionicons } from "@expo/vector-icons";
import { View , StyleSheet, Text } from "react-native";

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
                                color={isExam ? Colors.status.error : "#666"} 
                            />
                            <Text style={[styles.locationText, isExam && { color: Colors.status.error }]}>
                                {event.location || "Salle non définie"}
                            </Text>
                            
                            
                        </View>
                        <Text style={[styles.locationText, isExam && { color: Colors.status.error }]}>
                                {event.professors}
                            </Text>
                    </View>
                </View>
            </View>
        );
    };


const styles = StyleSheet.create({
    // Carte de Cours
    card: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 12,
        overflow: 'hidden',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 3,
    },
    accentBar: {
        width: 5,
        backgroundColor: Colors.primary,
    },
    cardContent: {
        flex: 1,
        flexDirection: 'row',
        padding: 15,
        alignItems: 'center',
    },
    timeContainer: {
        marginRight: 15,
        alignItems: 'center',
        minWidth: 50,
    },
    timeText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#2D3748',
    },
    timeSeparator: {
        fontSize: 10,
        color: '#CBD5E0',
        marginVertical: 2,
    },
    endTimeText: {
        fontSize: 13,
        color: '#718096',
    },
    infoContainer: {
        flex: 1,
        borderLeftWidth: 1,
        borderLeftColor: '#F0F0F0',
        paddingLeft: 15,
    },
    courseTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1A202C',
        marginBottom: 6,
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    locationText: {
        fontSize: 13,
        color: '#718096',
        marginLeft: 4,
    },
    cardExamShadow: {
        shadowColor: Colors.status.error, // Ombre rouge pour ressortir
        shadowOpacity: 0.15,
        elevation: 4,
        backgroundColor: '#FFF5F5', // Fond très légèrement rouge (optionnel, sinon laisser blanc)
    },
    examTimeText: {
        color: Colors.status.error,
        fontWeight: '800',
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap', // Pour que le badge passe à la ligne si le titre est trop long
        marginBottom: 4,
        gap: 8, // Espace entre le titre et le badge
    },
    examBadge: {
        backgroundColor: Colors.status.error, // Fond rouge
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    examBadgeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
})
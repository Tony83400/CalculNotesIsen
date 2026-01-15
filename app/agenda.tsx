import { getAgendaIsen } from "@/services/agendaApi";
import { AgendaEvent } from "@/types/agenda";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { 
    FlatList, 
    Text, 
    TouchableOpacity, 
    View, 
    StyleSheet, 
    SafeAreaView, 
    StatusBar,
    Platform 
} from "react-native";
import { Ionicons } from '@expo/vector-icons'; // Icônes standard Expo
import { Colors } from "@/constants/Colors";

interface AgendaProps {
    events: AgendaEvent[];
    day: string;
}

export default function Agenda() {
    const [courses, setCourses] = useState<AgendaProps[]>([]);
    const days = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

    const getAgenda = async () => {
        const rep = await getAgendaIsen();
        const startweek = new Date();
        startweek.setDate(startweek.getDate() - startweek.getDay() + 1);
        startweek.setHours(0, 0, 0, 0);

        const tempAgenda: AgendaProps[] = [];
        for (let i = 0; i < days.length; i++) {
            const startDay = new Date(startweek);
            startDay.setDate(startDay.getDate() + i)
            const endDay = new Date(startDay);
            endDay.setHours(23, 59, 59, 999);
            
            // On trie les cours par heure de début pour être sûr
            const filtered = rep.filter(event => {
                return event.start >= startDay && event.end <= endDay;
            }).sort((a, b) => a.start.getTime() - b.start.getTime());

            const newDay: AgendaProps = {
                day: days[i],
                events: filtered
            }
            tempAgenda.push(newDay);
        }
        setCourses(tempAgenda);
    };

    useEffect(() => {
        getAgenda();
    }, []);

    // Composant pour afficher un cours unique
    const CourseCard = ({ event }: { event: AgendaEvent }) => (
        <View style={styles.card}>
            {/* Barre de couleur à gauche */}
            <View style={styles.accentBar} />
            
            <View style={styles.cardContent}>
                <View style={styles.timeContainer}>
                    <Text style={styles.timeText}>
                        {event.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                    <Text style={styles.timeSeparator}>|</Text>
                    <Text style={styles.endTimeText}>
                        {event.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>
                
                <View style={styles.infoContainer}>
                    <Text style={styles.courseTitle} numberOfLines={2}>{event.title}</Text>
                    <View style={styles.locationContainer}>
                        <Ionicons name="location-sharp" size={14} color="#666" />
                        <Text style={styles.locationText}>{event.location || "Salle non définie"}</Text>
                    </View>
                </View>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            
            {/* Header Personnalisé */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.push("/selection")} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Emploi du temps</Text>
                <View style={{ width: 40 }} /> {/* Pour équilibrer le header */}
            </View>

            <FlatList
                data={courses}
                keyExtractor={(item) => item.day}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                    <View style={styles.daySection}>
                        <View style={styles.dayHeader}>
                            <Text style={styles.dayTitle}>{item.day}</Text>
                            <View style={styles.dayLine} />
                        </View>

                        {item.events.length > 0 ? (
                            item.events.map((event, index) => (
                                <CourseCard key={index} event={event} />
                            ))
                        ) : (
                            <Text style={styles.noClassText}>Aucun cours</Text>
                        )}
                    </View>
                )}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background, // Fond très clair, moderne
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
        marginTop: Platform.OS === 'android' ? 30 : 0,
    },
    backButton: {
        padding: 8,
        borderRadius: 50,
        backgroundColor: '#F0F2F5',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1A1A1A',
    },
    listContent: {
        padding: 20,
        paddingBottom: 40,
    },
    daySection: {
        marginBottom: 25,
    },
    dayHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    dayTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: Colors.text.primary,
        marginRight: 10,
    },
    dayLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#E0E0E0',
    },
    noClassText: {
        fontStyle: 'italic',
        color: '#A0AEC0',
        fontSize: 14,
        marginLeft: 10,
    },
    // Styles de la Carte de Cours
    card: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 12,
        overflow: 'hidden',
        // Ombres douces (Shadows)
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 3, // Pour Android
    },
    accentBar: {
        width: 5,
        backgroundColor: Colors.primary , // Bleu type "agenda"
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
});
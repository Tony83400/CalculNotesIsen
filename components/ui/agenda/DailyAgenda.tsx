import React, { useState } from "react";
import { 
    StyleSheet, 
    View, 
    Text, 
    ScrollView, 
    TouchableOpacity,
    useWindowDimensions
} from "react-native";
import { Colors } from "@/constants/Colors";
import { AgendaEvent } from "@/types/agenda";
import { MapPin, Calendar as CalendarIcon, AlertCircle, Clock, User } from "lucide-react-native";
import { formatTime } from "@/utils/agenda";
import EventDetailModal from "./EventDetailModal";

interface DailyAgendaProps {
    events: AgendaEvent[];
    selectedDate: Date;
}

export default function DailyAgenda({ events, selectedDate }: DailyAgendaProps) {
    const { width: windowWidth } = useWindowDimensions();
    const [selectedEvent, setSelectedEvent] = useState<AgendaEvent | null>(null);

    // Paramètres de la Timeline
    const HOUR_HEIGHT = 65; // Réduit pour plus de compacité
    const LEFT_COLUMN_WIDTH = 50;
    const START_HOUR = 8;
    const END_HOUR = 20;
    const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => i + START_HOUR);

    // Filtrer et trier les événements du jour
    const dailyEvents = events
        .filter(event => {
            const eventDate = new Date(event.start);
            return eventDate.toDateString() === selectedDate.toDateString();
        });

    const getEventStyle = (event: AgendaEvent) => {
        const startHour = event.start.getHours() + event.start.getMinutes() / 60;
        const endHour = event.end.getHours() + event.end.getMinutes() / 60;
        const duration = endHour - startHour;

        return {
            top: (startHour - START_HOUR) * HOUR_HEIGHT + 10,
            height: duration * HOUR_HEIGHT - 4,
            left: 8,
            width: windowWidth - LEFT_COLUMN_WIDTH - 20,
        };
    };

    if (dailyEvents.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <View style={styles.emptyIconContainer}>
                    <CalendarIcon size={48} color={Colors.text.tertiary} strokeWidth={1.5} />
                </View>
                <Text style={styles.emptyTitle}>Aucun cours prévu</Text>
                <Text style={styles.emptySubtitle}>Profitez de votre temps libre !</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={styles.timelineContainer}>
                    
                    {/* Colonne des Heures */}
                    <View style={[styles.hoursColumn, { width: LEFT_COLUMN_WIDTH }]}>
                        {hours.map((hour) => (
                            <View key={hour} style={[styles.hourLabelContainer, { height: HOUR_HEIGHT }]}>
                                <Text style={styles.hourLabel}>{hour}h</Text>
                                <View style={styles.hourDot} />
                            </View>
                        ))}
                    </View>

                    {/* Grille et Événements */}
                    <View style={styles.eventsGrid}>
                        {/* Lignes de fond */}
                        {hours.map((hour) => (
                            <View key={hour} style={[styles.gridLine, { height: HOUR_HEIGHT }]} />
                        ))}

                        {/* Les cours positionnés */}
                        {dailyEvents.map((event, index) => {
                            const eventStyle = getEventStyle(event);
                            const isExam = event.isExam;
                            const durationMinutes = (event.end.getTime() - event.start.getTime()) / (1000 * 60);

                            return (
                                <TouchableOpacity 
                                    key={event.id || index} 
                                    activeOpacity={0.8}
                                    onPress={() => setSelectedEvent(event)}
                                    style={[
                                        styles.eventCard,
                                        eventStyle,
                                        isExam ? styles.examCard : styles.regularCard
                                    ]}
                                >
                                    <View style={styles.eventMain}>
                                        <View style={styles.titleRow}>
                                            {isExam && (
                                                <View style={styles.examBadge}>
                                                    <AlertCircle size={10} color={Colors.status.error} />
                                                    <Text style={styles.examBadgeText}>EXAMEN</Text>
                                                </View>
                                            )}
                                            <Text style={[styles.eventTitle, isExam && styles.examText]} numberOfLines={durationMinutes < 45 ? 1 : 2}>
                                                {event.title}
                                            </Text>
                                        </View>

                                        <View style={[styles.infoContainer, durationMinutes < 60 && styles.infoContainerCompact]}>
                                            <View style={styles.infoItem}>
                                                <Clock size={12} color={isExam ? Colors.status.error : Colors.text.tertiary} />
                                                <Text style={[styles.infoText, isExam && styles.examText]}>
                                                    {formatTime(event.start)} - {formatTime(event.end)}
                                                </Text>
                                            </View>
                                            
                                            <View style={styles.infoItem}>
                                                <MapPin size={12} color={isExam ? Colors.status.error : Colors.text.tertiary} />
                                                <Text style={[styles.infoText, isExam && styles.examText]} numberOfLines={1}>
                                                    {event.location}
                                                </Text>
                                            </View>

                                            {event.professors && durationMinutes > 60 && (
                                                <View style={styles.infoItem}>
                                                    <User size={12} color={isExam ? Colors.status.error : Colors.text.tertiary} />
                                                    <Text style={[styles.infoText, isExam && styles.examText]} numberOfLines={1}>
                                                        {event.professors}
                                                    </Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>
            </ScrollView>

            <EventDetailModal 
                event={selectedEvent}
                visible={!!selectedEvent}
                onClose={() => setSelectedEvent(null)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    scrollContent: {
        paddingVertical: 20,
    },
    timelineContainer: {
        flexDirection: 'row',
        paddingRight: 15,
    },
    hoursColumn: {
        alignItems: 'center',
    },
    hourLabelContainer: {
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    hourLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: Colors.text.tertiary,
        marginTop: -6,
    },
    hourDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: Colors.divider,
        marginTop: 8,
    },
    eventsGrid: {
        flex: 1,
        borderLeftWidth: 1,
        borderLeftColor: Colors.divider,
        marginLeft: -2, 
    },
    gridLine: {
        borderBottomWidth: 0.5,
        borderBottomColor: Colors.divider,
    },
    eventCard: {
        position: 'absolute',
        borderRadius: 12,
        padding: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 6,
        elevation: 1,
        borderLeftWidth: 4,
        borderWidth: 1,
        borderColor: Colors.divider,
    },
    regularCard: {
        borderLeftColor: Colors.primary,
        backgroundColor: Colors.surface,
    },
    examCard: {
        borderLeftColor: Colors.status.error,
        backgroundColor: '#FFF1F2', 
        borderColor: '#FFE4E6',
    },
    eventMain: {
        flex: 1,
        justifyContent: 'space-between',
    },
    titleRow: {
        marginBottom: 4,
    },
    eventTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.text.primary,
        lineHeight: 18,
        letterSpacing: -0.2,
    },
    examBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.status.error + '10',
        paddingHorizontal: 6,
        paddingVertical: 1.5,
        borderRadius: 6,
        alignSelf: 'flex-start',
        marginBottom: 4,
        gap: 3,
    },
    examBadgeText: {
        fontSize: 8,
        fontWeight: '800',
        color: Colors.status.error,
    },
    infoContainer: {
        gap: 3,
    },
    infoContainerCompact: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        columnGap: 12,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    infoText: {
        fontSize: 11,
        fontWeight: '600',
        color: Colors.text.secondary,
    },
    examText: {
        color: '#991B1B',
    },
    // Empty State
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.background,
        paddingHorizontal: 40,
    },
    emptyIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: Colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.02,
        shadowRadius: 10,
        elevation: 2,
        borderWidth: 1,
        borderColor: Colors.divider,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text.primary,
        marginBottom: 6,
        letterSpacing: -0.3,
    },
    emptySubtitle: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.text.tertiary,
        textAlign: 'center',
    }
});
import React from "react";
import { StyleSheet, View, Text, ScrollView, useWindowDimensions } from "react-native";
import { Colors } from "@/constants/Colors";
import { AgendaEvent } from "@/types/agenda";

interface AgendaGridProps {
    events: AgendaEvent[];
    startDay: Date;
}

export default function AgendaGrid({ events, startDay }: AgendaGridProps) {
    const { width: windowWidth } = useWindowDimensions();
    
    // Dimensions classiques et équilibrées
    const LEFT_COLUMN_WIDTH = 45; 
    const DAY_WIDTH = (windowWidth - LEFT_COLUMN_WIDTH) / 6; 
    const HOUR_HEIGHT = 58; // Réduit d'environ 10% (de 65 à 58)

    const hours = Array.from({ length: 13 }, (_, i) => i + 8); 
    const days = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

    const cleanTitle = (title: string) => {
        return title.replace(/Semestre \d - /, '').trim();
    };

    const getEventStyle = (event: AgendaEvent) => {
        const startHour = event.start.getHours() + event.start.getMinutes() / 60;
        const endHour = event.end.getHours() + event.end.getMinutes() / 60;
        const duration = endHour - startHour;

        const eventDate = new Date(event.start);
        eventDate.setHours(0,0,0,0);
        const refDate = new Date(startDay);
        refDate.setHours(0,0,0,0);
        
        const diffTime = eventDate.getTime() - refDate.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0 || diffDays > 5) return null;

        return {
            top: (startHour - 8) * HOUR_HEIGHT,
            height: duration * HOUR_HEIGHT - 2, 
            left: diffDays * DAY_WIDTH + 2,
            width: DAY_WIDTH - 4,
        };
    };

    return (
        <View style={styles.container}>
            {/* Header des Jours */}
            <View style={styles.headerRow}>
                <View style={{ width: LEFT_COLUMN_WIDTH }} />
                <View style={styles.daysRow}>
                    {days.map((day) => (
                        <View key={day} style={styles.dayLabelContainer}>
                            <Text style={styles.dayLabel}>{day}</Text>
                        </View>
                    ))}
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.gridBody}>
                    {/* Colonne des Heures */}
                    <View style={[styles.hoursColumn, { width: LEFT_COLUMN_WIDTH }]}>
                        {hours.map((hour) => (
                            <View key={hour} style={[styles.hourLabelContainer, { height: HOUR_HEIGHT }]}>
                                <Text style={styles.hourLabel}>{hour}h</Text>
                            </View>
                        ))}
                    </View>

                    {/* Grille */}
                    <View style={{ width: windowWidth - LEFT_COLUMN_WIDTH, height: hours.length * HOUR_HEIGHT }}>
                        {days.map((_, dayIndex) => (
                            <View key={dayIndex} style={[styles.gridColumn, { left: dayIndex * DAY_WIDTH, width: DAY_WIDTH }]}>
                                {hours.map((_, hourIndex) => (
                                    <View key={hourIndex} style={[styles.gridCell, { height: HOUR_HEIGHT }]} />
                                ))}
                            </View>
                        ))}

                        {events.map((event, index) => {
                            const eventStyle = getEventStyle(event);
                            if (!eventStyle) return null;

                            const durationHours = (event.end.getTime() - event.start.getTime()) / (1000 * 60 * 60);

                            return (
                                <View 
                                    key={event.id || index} 
                                    style={[
                                        styles.eventBlock, 
                                        eventStyle,
                                        event.isExam ? styles.examBlock : styles.regularBlock
                                    ]}
                                >
                                    {event.isExam && (
                                        <Text style={styles.examLabel}>EXAMEN</Text>
                                    )}

                                    <Text 
                                        style={[styles.eventTitle, event.isExam && styles.examText]} 
                                        numberOfLines={durationHours > 1.5 ? 4 : 2}
                                    >
                                        {cleanTitle(event.title)}
                                    </Text>
                                    
                                    {durationHours >= 1 && (
                                        <View style={styles.eventDetails}>
                                            <Text style={[styles.eventLocation, event.isExam && styles.examText]} numberOfLines={1}>
                                                {event.location}
                                            </Text>
                                            {event.professors ? (
                                                <Text style={[styles.eventProf, event.isExam && styles.examText]} numberOfLines={durationHours > 1.5 ? 3 : 1}>
                                                    {event.professors}
                                                </Text>
                                            ) : null}
                                        </View>
                                    )}
                                </View>
                            );
                        })}
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.surface,
    },
    headerRow: {
        flexDirection: 'row',
        backgroundColor: Colors.background,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    daysRow: {
        flexDirection: 'row',
        flex: 1,
    },
    dayLabelContainer: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 12,
        borderRightWidth: 1,
        borderRightColor: Colors.divider,
    },
    dayLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: Colors.text.primary,
        textTransform: 'uppercase',
    },
    gridBody: {
        flexDirection: 'row',
    },
    hoursColumn: {
        backgroundColor: Colors.background,
        borderRightWidth: 1,
        borderRightColor: Colors.border,
    },
    hourLabelContainer: {
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingTop: 4,
    },
    hourLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: Colors.text.tertiary,
    },
    gridColumn: {
        position: 'absolute',
        height: '100%',
        borderRightWidth: 0.5,
        borderRightColor: Colors.divider,
    },
    gridCell: {
        borderBottomWidth: 0.5,
        borderBottomColor: Colors.divider,
    },
    eventBlock: {
        position: 'absolute',
        borderRadius: 4,
        padding: 6,
        borderLeftWidth: 3,
        justifyContent: 'flex-start',
        overflow: 'hidden',
    },
    regularBlock: {
        backgroundColor: Colors.primary + '10', 
        borderLeftColor: Colors.primary,
    },
    examBlock: {
        backgroundColor: Colors.status.error + '15',
        borderLeftColor: Colors.status.error,
        borderWidth: 0.5,
        borderColor: Colors.status.error + '30',
    },
    examLabel: {
        fontSize: 7,
        fontWeight: '900',
        color: Colors.status.error,
        marginBottom: 2,
        letterSpacing: 0.5,
    },
    eventTitle: {
        fontSize: 11,
        fontWeight: '700',
        color: Colors.text.primary,
        lineHeight: 13,
    },
    examText: {
        color: '#991B1B', // Rouge foncé pour lisibilité sur fond clair
    },
    eventDetails: {
        marginTop: 4,
        gap: 2,
    },
    eventLocation: {
        fontSize: 10,
        fontWeight: '600',
        color: Colors.text.secondary,
    },
    eventProf: {
        fontSize: 9,
        color: Colors.text.secondary,
        fontStyle: 'italic',
        opacity: 0.8,
    }
});
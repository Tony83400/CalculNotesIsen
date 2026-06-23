import React, { useState } from "react";
import { StyleSheet, View, Text, ScrollView, useWindowDimensions, TouchableOpacity } from "react-native";
import { Colors } from "@/constants/Colors";
import { AgendaEvent } from "@/types/agenda";
import { formatTime } from "@/utils/agenda";
import EventDetailModal from "./EventDetailModal";

interface AgendaGridProps {
    events: AgendaEvent[];
    startDay: Date;
}

export default function AgendaGrid({ events, startDay }: AgendaGridProps) {
    const { width: windowWidth } = useWindowDimensions();
    const [selectedEvent, setSelectedEvent] = useState<AgendaEvent | null>(null);
    
    // Dimensions classiques et équilibrées
    const LEFT_COLUMN_WIDTH = 45; 
    const DAY_WIDTH = (windowWidth - LEFT_COLUMN_WIDTH) / 6; 
    const HOUR_HEIGHT = 58; 

    const hours = Array.from({ length: 13 }, (_, i) => i + 8); 
    
    const getDayInfo = (index: number) => {
        const date = new Date(startDay);
        date.setDate(date.getDate() + index);
        
        const dayNames = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
        const dayName = dayNames[date.getDay()];
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        
        const today = new Date();
        const isToday = date.getDate() === today.getDate() &&
                        date.getMonth() === today.getMonth() &&
                        date.getFullYear() === today.getFullYear();

        return {
            dayName,
            dateStr: `${day}/${month}`,
            isToday
        };
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
                    {[0, 1, 2, 3, 4, 5].map((index) => {
                        const { dayName, dateStr, isToday } = getDayInfo(index);
                        return (
                            <View key={index} style={[styles.dayLabelContainer, isToday && styles.todayHeader]}>
                                <Text style={[styles.dayLabel, isToday && styles.todayLabelText]}>
                                    {dayName}{"\n"}{dateStr}
                                </Text>
                            </View>
                        );
                    })}
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
                        {[0, 1, 2, 3, 4, 5].map((index) => {
                            const { isToday } = getDayInfo(index);
                            return (
                                <View 
                                    key={index} 
                                    style={[
                                        styles.gridColumn, 
                                        { left: index * DAY_WIDTH, width: DAY_WIDTH },
                                        isToday && styles.todayColumn
                                    ]}
                                >
                                    {hours.map((_, hourIndex) => (
                                        <View key={hourIndex} style={[styles.gridCell, { height: HOUR_HEIGHT }]} />
                                    ))}
                                </View>
                            );
                        })}

                        {events.map((event, index) => {
                            const eventStyle = getEventStyle(event);
                            if (!eventStyle) return null;

                            const durationHours = (event.end.getTime() - event.start.getTime()) / (1000 * 60 * 60);

                            return (
                                <TouchableOpacity 
                                    key={event.id || index} 
                                    activeOpacity={0.7}
                                    onPress={() => setSelectedEvent(event)}
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
                                        numberOfLines={durationHours > 1.2 ? 4 : 2}
                                    >
                                        {event.title}
                                    </Text>
                                    
                                    <View style={styles.eventDetails}>
                                        <Text style={[styles.eventTime, event.isExam && styles.examText]} numberOfLines={1}>
                                            {formatTime(event.start)} - {formatTime(event.end)}
                                        </Text>
                                        <Text style={[styles.eventLocation, event.isExam && styles.examText]} numberOfLines={1}>
                                            {event.location}
                                        </Text>
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
        backgroundColor: Colors.surface,
    },
    headerRow: {
        flexDirection: 'row',
        backgroundColor: Colors.surface,
        borderBottomWidth: 0.5,
        borderBottomColor: Colors.divider,
    },
    daysRow: {
        flexDirection: 'row',
        flex: 1,
    },
    dayLabelContainer: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 10,
    },
    dayLabel: {
        fontSize: 9,
        fontWeight: '600',
        color: Colors.text.secondary,
        textAlign: 'center',
        lineHeight: 13,
    },
    todayHeader: {
        borderBottomWidth: 2,
        borderBottomColor: Colors.primary,
    },
    todayLabelText: {
        color: Colors.primary,
        fontWeight: '800',
    },
    gridBody: {
        flexDirection: 'row',
    },
    hoursColumn: {
        backgroundColor: Colors.surface,
        borderRightWidth: 0.5,
        borderRightColor: Colors.divider,
    },
    hourLabelContainer: {
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingTop: 4,
    },
    hourLabel: {
        fontSize: 9,
        fontWeight: '600',
        color: Colors.text.tertiary,
    },
    gridColumn: {
        position: 'absolute',
        height: '100%',
        borderRightWidth: 0.5,
        borderRightColor: Colors.divider,
    },
    todayColumn: {
        backgroundColor: Colors.primary + '03',
    },
    gridCell: {
        borderBottomWidth: 0.5,
        borderBottomColor: Colors.divider,
    },
    eventBlock: {
        position: 'absolute',
        borderRadius: 6,
        padding: 5,
        borderLeftWidth: 3,
        borderWidth: 0.5,
        borderColor: Colors.divider,
        justifyContent: 'flex-start',
        overflow: 'hidden',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.01,
        shadowRadius: 2,
    },
    regularBlock: {
        backgroundColor: '#F0F6FF', 
        borderLeftColor: Colors.primary,
    },
    examBlock: {
        backgroundColor: '#FFF1F2',
        borderLeftColor: Colors.status.error,
        borderColor: '#FFE4E6',
    },
    examLabel: {
        fontSize: 7,
        fontWeight: '800',
        color: Colors.status.error,
        marginBottom: 1,
        letterSpacing: 0.3,
    },
    eventTitle: {
        fontSize: 10,
        fontWeight: '700',
        color: Colors.text.primary,
        lineHeight: 12,
        letterSpacing: -0.1,
    },
    examText: {
        color: '#991B1B', 
    },
    eventDetails: {
        marginTop: 2,
        gap: 0.5,
    },
    eventTime: {
        fontSize: 8,
        fontWeight: '500',
        color: Colors.text.tertiary,
    },
    eventLocation: {
        fontSize: 9,
        fontWeight: '600',
        color: Colors.text.secondary,
    }
});
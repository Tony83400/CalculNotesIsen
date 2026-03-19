import React, { useState } from "react";
import { StyleSheet, View, Text, ScrollView, useWindowDimensions, TouchableOpacity, Modal, Pressable } from "react-native";
import { Colors } from "@/constants/Colors";
import { AgendaEvent } from "@/types/agenda";
import { Clock, MapPin, X } from "lucide-react-native";

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

    const formatTime = (date: Date) => {
        const hours = date.getHours();
        const minutes = date.getMinutes();
        return `${hours}h${minutes.toString().padStart(2, '0')}`;
    };

    const formatFullDate = (date: Date) => {
        const dayNames = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
        const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
        return `${dayNames[date.getDay()]} ${date.getDate()} ${monthNames[date.getMonth()]}`;
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

            {/* Modal de Détails */}
            <Modal
                transparent
                visible={!!selectedEvent}
                animationType="fade"
                onRequestClose={() => setSelectedEvent(null)}
            >
                <Pressable 
                    style={styles.modalOverlay} 
                    onPress={() => setSelectedEvent(null)}
                >
                    <View style={styles.modalContent}>
                        <View style={[
                            styles.modalHeader,
                            selectedEvent?.isExam ? styles.examModalHeader : styles.regularModalHeader
                        ]}>
                            <View style={{ flex: 1 }}>
                                {selectedEvent?.isExam && <Text style={styles.examLabelModal}>EXAMEN</Text>}
                                <Text style={styles.modalTitle}>{selectedEvent?.title}</Text>
                            </View>
                            <TouchableOpacity 
                                onPress={() => setSelectedEvent(null)}
                                style={styles.closeButton}
                            >
                                <X size={24} color={Colors.text.secondary} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalBody}>
                            <View style={styles.detailItem}>
                                <Clock size={20} color={Colors.primary} style={styles.detailIcon} />
                                <View>
                                    <Text style={styles.detailLabel}>Horaire</Text>
                                    <Text style={styles.detailValue}>
                                        {selectedEvent && formatFullDate(selectedEvent.start)}
                                    </Text>
                                    <Text style={styles.detailSubValue}>
                                        {selectedEvent && formatTime(selectedEvent.start)} - {selectedEvent && formatTime(selectedEvent.end)}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.detailItem}>
                                <MapPin size={20} color={Colors.primary} style={styles.detailIcon} />
                                <View>
                                    <Text style={styles.detailLabel}>Lieu</Text>
                                    <Text style={styles.detailValue}>{selectedEvent?.location}</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </Pressable>
            </Modal>
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
        fontSize: 10,
        fontWeight: '700',
        color: Colors.text.primary,
        textTransform: 'uppercase',
        textAlign: 'center',
    },
    todayHeader: {
        backgroundColor: Colors.primary + '15',
        borderBottomWidth: 2,
        borderBottomColor: Colors.primary,
    },
    todayLabelText: {
        color: Colors.primary,
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
    todayColumn: {
        backgroundColor: Colors.primary + '08',
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
        gap: 1,
    },
    eventTime: {
        fontSize: 9,
        fontWeight: '600',
        color: Colors.text.tertiary,
    },
    eventLocation: {
        fontSize: 10,
        fontWeight: '600',
        color: Colors.text.secondary,
    },
    // Styles Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalContent: {
        width: '100%',
        backgroundColor: Colors.surface,
        borderRadius: 24,
        overflow: 'hidden',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
    },
    modalHeader: {
        padding: 24,
        flexDirection: 'row',
        alignItems: 'flex-start',
        borderBottomWidth: 1,
        borderBottomColor: Colors.divider,
    },
    regularModalHeader: {
        borderLeftWidth: 6,
        borderLeftColor: Colors.primary,
    },
    examModalHeader: {
        borderLeftWidth: 6,
        borderLeftColor: Colors.status.error,
        backgroundColor: Colors.status.error + '05',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: Colors.text.primary,
        lineHeight: 26,
        letterSpacing: -0.5,
    },
    examLabelModal: {
        fontSize: 10,
        fontWeight: '900',
        color: Colors.status.error,
        marginBottom: 6,
        letterSpacing: 1,
    },
    closeButton: {
        padding: 4,
        marginLeft: 12,
    },
    modalBody: {
        padding: 24,
        gap: 24,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    detailIcon: {
        marginTop: 2,
        marginRight: 16,
    },
    detailLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.text.tertiary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    detailValue: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text.primary,
    },
    detailSubValue: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.primary,
        marginTop: 2,
    }
});
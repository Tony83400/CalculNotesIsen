import React, { useState } from "react";
import { StyleSheet, View, Text, ScrollView, useWindowDimensions, TouchableOpacity } from "react-native";
import { Colors } from "@/constants/Colors";
import { AgendaEvent } from "@/types/agenda";
import { formatTime } from "@/utils/agenda";
import EventDetailModal from "./EventDetailModal";

interface AgendaGridProps {
    events: AgendaEvent[];
    startDay: Date;
    scrollEnabled?: boolean;
}

export default function AgendaGrid({ events, startDay, scrollEnabled = true }: AgendaGridProps) {
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

    // Filter events and map them to their day column
    const getEventsWithLayout = () => {
        const eventsByDay: AgendaEvent[][] = [[], [], [], [], [], []];
        
        events.forEach(event => {
            const eventDate = new Date(event.start);
            eventDate.setHours(0,0,0,0);
            const refDate = new Date(startDay);
            refDate.setHours(0,0,0,0);
            
            const diffTime = eventDate.getTime() - refDate.getTime();
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays >= 0 && diffDays <= 5) {
                eventsByDay[diffDays].push(event);
            }
        });

        const allLayouts: { event: AgendaEvent, startHour: number, endHour: number, column: number, totalColumns: number, dayIndex: number }[] = [];

        eventsByDay.forEach((dayEvents, dayIndex) => {
            const sortedEvents = [...dayEvents].sort((a, b) => a.start.getTime() - b.start.getTime());
            
            const layouts = sortedEvents.map(event => ({
                event,
                startHour: event.start.getHours() + event.start.getMinutes() / 60,
                endHour: event.end.getHours() + event.end.getMinutes() / 60,
                column: 0,
                totalColumns: 1,
                dayIndex
            }));

            let currentCluster: typeof layouts = [];
            let clusterEndHour = 0;

            layouts.forEach((item) => {
                if (currentCluster.length > 0 && item.startHour >= clusterEndHour) {
                    const maxCol = currentCluster.reduce((max, e) => Math.max(max, e.column + 1), 0);
                    currentCluster.forEach(i => i.totalColumns = maxCol);
                    allLayouts.push(...currentCluster);
                    currentCluster = [];
                    clusterEndHour = 0;
                }

                const columnsInCluster: (typeof layouts)[] = [];
                currentCluster.forEach(i => {
                    if (!columnsInCluster[i.column]) columnsInCluster[i.column] = [];
                    columnsInCluster[i.column].push(i);
                });

                let placed = false;
                for (let col = 0; col < columnsInCluster.length; col++) {
                    const columnItems = columnsInCluster[col] || [];
                    const lastItem = columnItems[columnItems.length - 1];
                    if (!lastItem || lastItem.endHour <= item.startHour) {
                        item.column = col;
                        placed = true;
                        break;
                    }
                }

                if (!placed) {
                    item.column = columnsInCluster.length;
                }

                currentCluster.push(item);
                clusterEndHour = Math.max(clusterEndHour, item.endHour);
            });

            if (currentCluster.length > 0) {
                const maxCol = currentCluster.reduce((max, e) => Math.max(max, e.column + 1), 0);
                currentCluster.forEach(i => i.totalColumns = maxCol);
                allLayouts.push(...currentCluster);
            }
        });

        return allLayouts;
    };

    const eventLayouts = getEventsWithLayout();

    const gridContent = (
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
                                index < 5 && styles.dayColumnSeparator,
                                isToday && styles.todayColumn
                            ]}
                        >
                            {hours.map((_, hourIndex) => (
                                <View key={hourIndex} style={[styles.gridCell, { height: HOUR_HEIGHT }]} />
                            ))}
                        </View>
                    );
                })}

                {eventLayouts.map((layoutItem, index) => {
                    const { event, startHour, endHour, column, totalColumns, dayIndex } = layoutItem;
                    
                    const durationHours = endHour - startHour;
                    const width = (DAY_WIDTH - 4) / totalColumns;
                    const left = dayIndex * DAY_WIDTH + 2 + column * width;
                    const cardHeight = durationHours * HOUR_HEIGHT - 2;

                    const eventStyle = {
                        top: (startHour - 8) * HOUR_HEIGHT,
                        height: cardHeight, 
                        left: left,
                        width: width,
                    };

                    // Calcul dynamique du nombre de lignes disponibles pour le titre
                    const badgesHeight = (event.isExam ? 12 : 0) + (event.userName ? 12 : 0);
                    const detailsHeight = durationHours < 0.8 ? 12 : 24;
                    const availableTitleHeight = cardHeight - 10 - badgesHeight - detailsHeight;
                    const maxTitleLines = Math.max(1, Math.floor(availableTitleHeight / 12));

                    return (
                        <TouchableOpacity 
                            key={`${event.id || 'evt'}-${index}`} 
                            activeOpacity={0.7}
                            onPress={() => setSelectedEvent(event)}
                            style={[
                                styles.eventBlock, 
                                eventStyle,
                                event.isExam ? styles.examBlock : (event.color ? undefined : styles.regularBlock),
                                event.color && !event.isExam ? { backgroundColor: event.color + '15', borderLeftColor: event.color } : undefined
                            ]}
                        >
                            {event.isExam && (
                                <Text style={styles.examLabel}>EXAMEN</Text>
                            )}
                            {event.userName && (
                                <Text style={[styles.examLabel, { color: event.color || Colors.text.secondary }]} numberOfLines={1}>
                                    {event.userName}
                                </Text>
                            )}

                            <Text 
                                style={[styles.eventTitle, event.isExam && styles.examText, event.color && !event.isExam ? { color: event.color } : undefined]} 
                                numberOfLines={maxTitleLines}
                            >
                                {event.title}
                            </Text>
                            
                            <View style={styles.eventDetails}>
                                <Text style={[styles.eventTime, event.isExam && styles.examText]} numberOfLines={1}>
                                    {formatTime(event.start)} - {formatTime(event.end)}
                                </Text>
                                {durationHours >= 0.8 && (
                                    <Text style={[styles.eventLocation, event.isExam && styles.examText]} numberOfLines={1}>
                                        {event.location}
                                    </Text>
                                )}
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );

    return (
        <View style={[styles.container, !scrollEnabled && { flex: undefined }]}>
            {/* Header des Jours */}
            <View style={styles.headerRow}>
                <View style={[styles.hoursHeaderCell, { width: LEFT_COLUMN_WIDTH }]} />
                <View style={styles.daysRow}>
                    {[0, 1, 2, 3, 4, 5].map((index) => {
                        const { dayName, dateStr, isToday } = getDayInfo(index);
                        return (
                            <View 
                                key={index} 
                                style={[
                                    styles.dayLabelContainer, 
                                    index < 5 && styles.dayColumnSeparator,
                                    isToday && styles.todayHeader
                                ]}
                            >
                                <Text style={[styles.dayLabel, isToday && styles.todayLabelText]}>
                                    {dayName}{"\n"}{dateStr}
                                </Text>
                            </View>
                        );
                    })}
                </View>
            </View>

            {scrollEnabled ? (
                <ScrollView showsVerticalScrollIndicator={false}>
                    {gridContent}
                </ScrollView>
            ) : (
                gridContent
            )}

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
        maxWidth: '100%',
        overflow: 'hidden',
    },
    headerRow: {
        flexDirection: 'row',
        backgroundColor: Colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        maxWidth: '100%',
    },
    hoursHeaderCell: {
        borderRightWidth: 1,
        borderRightColor: Colors.border,
    },
    daysRow: {
        flexDirection: 'row',
        flex: 1,
        minWidth: 0,
    },
    dayLabelContainer: {
        flex: 1,
        minWidth: 0,
        alignItems: 'center',
        paddingVertical: 10,
    },
    dayColumnSeparator: {
        borderRightWidth: 1,
        borderRightColor: Colors.border,
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
        backgroundColor: Colors.primary + '08',
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
        borderRightWidth: 1,
        borderRightColor: Colors.border,
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
    },
    todayColumn: {
        backgroundColor: Colors.primary + '05',
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
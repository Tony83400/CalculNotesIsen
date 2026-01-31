import CompactCourseCard from "@/components/ui/agenda/CompactCourseCard";
import { Colors } from "@/constants/Colors";
import { getAgendaIsen } from "@/services/agendaApi";
import { AgendaEvent } from "@/types/agenda";
import { Ionicons } from '@expo/vector-icons';
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ScrollView
} from "react-native";

interface DayColumnData {
    title: string;
    data: AgendaEvent[];
}

// --- Grid Constants ---
const HOUR_HEIGHT = 60; // Height of one hour slot in pixels
const START_HOUR = 8;   // Day starts at 8:00
const END_HOUR = 20;    // Day ends at 20:00

export default function Agenda() {
    const [allEvents, setAllEvents] = useState<AgendaEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const [weekToShow, setWeekToShow] = useState<Date>(() => {
        const today = new Date();
        const day = today.getDay();
        const diff = today.getDate() - day + (day === 0 ? -6 : 1);
        const startOfWeek = new Date(today.setDate(diff));
        startOfWeek.setHours(0, 0, 0, 0);
        return startOfWeek;
    });

    const fetchAgendaForWeek = async (startDate: Date) => {
        setIsLoading(true);
        try {
            const events = await getAgendaIsen(startDate);
            setAllEvents(events);
        } catch (error) {
            console.error("Failed to fetch agenda:", error);
            setAllEvents([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAgendaForWeek(weekToShow);
    }, [weekToShow]);

    const weeklyAgendaData = useMemo((): DayColumnData[] => {
        const weekData: DayColumnData[] = [];
        const dayNames = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

        for (let i = 0; i < 6; i++) {
            const currentDay = new Date(weekToShow);
            currentDay.setDate(weekToShow.getDate() + i);
            
            const dayEvents = allEvents
                .filter(event => {
                    const eventDate = event.start;
                    return eventDate.getDate() === currentDay.getDate() &&
                           eventDate.getMonth() === currentDay.getMonth() &&
                           eventDate.getFullYear() === currentDay.getFullYear();
                })
                .sort((a, b) => a.start.getTime() - b.start.getTime());

            weekData.push({
                title: `${dayNames[i]} ${currentDay.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}`,
                data: dayEvents,
            });
        }
        return weekData;
    }, [allEvents, weekToShow]);

    const changeWeek = (weekOffset: number) => {
        setWeekToShow(prev => {
            const newDate = new Date(prev);
            newDate.setDate(newDate.getDate() + (weekOffset * 7));
            return newDate;
        });
    };

    const getEventStyle = (event: AgendaEvent) => {
        const start = event.start.getHours() + event.start.getMinutes() / 60;
        const end = event.end.getHours() + event.end.getMinutes() / 60;
        
        const top = (start - START_HOUR) * HOUR_HEIGHT;
        const height = (end - start) * HOUR_HEIGHT;

        return { top, height };
    };

    const HourGrid = () => {
        const hours = [];
        for (let i = START_HOUR; i < END_HOUR; i++) {
            hours.push(i);
        }
        return (
            <View style={StyleSheet.absoluteFill}>
                {hours.map(hour => (
                    <View key={hour} style={[styles.hourSlot, { height: HOUR_HEIGHT }]}>
                        <Text style={styles.hourText}>{`${hour}:00`}</Text>
                    </View>
                ))}
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
                    <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Emploi du temps</Text>
                <View style={{ width: 44 }} />
            </View>
            
            {/* Week Navigation */}
            <View style={styles.weekNav}>
                <TouchableOpacity onPress={() => changeWeek(-1)} style={styles.navButton}>
                    <Ionicons name="chevron-back" size={22} color={Colors.primary} />
                </TouchableOpacity>
                <Text style={styles.weekText}>
                    {`Semaine du ${weekToShow.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long' })}`}
                </Text>
                <TouchableOpacity onPress={() => changeWeek(1)} style={styles.navButton}>
                    <Ionicons name="chevron-forward" size={22} color={Colors.primary} />
                </TouchableOpacity>
            </View>

            {isLoading ? (
                <ActivityIndicator style={{ flex: 1 }} size="large" color={Colors.primary} />
            ) : (
                <>
                    <View style={styles.dayHeaderRow}>
                        <View style={styles.hourColumn} />
                        {weeklyAgendaData.map(day => (
                            <Text key={day.title} style={styles.dayHeaderText}>{day.title}</Text>
                        ))}
                    </View>
                    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                        <View style={styles.gridContainer}>
                            <View style={styles.hourColumn}><HourGrid /></View>
                            {weeklyAgendaData.map(day => (
                                <View key={day.title} style={styles.dayColumn}>
                                    {day.data.map(event => (
                                        <View key={event.id || event.start.toISOString()} style={[styles.eventContainer, getEventStyle(event)]}>
                                            <CompactCourseCard event={event} />
                                        </View>
                                    ))}
                                </View>
                            ))}
                        </View>
                    </ScrollView>
                </>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.surface,
    },
    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderColor: Colors.border,
    },
    headerButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: Colors.text.primary,
    },
    // Week Nav
    weekNav: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: Colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    navButton: {
        padding: 8,
        minHeight: 44,
        justifyContent: 'center',
    },
    weekText: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.text.secondary,
    },
    // Grid Layout
    dayHeaderRow: {
        flexDirection: 'row',
        backgroundColor: Colors.surface,
        borderBottomWidth: 1,
        borderColor: Colors.border,
    },
    dayHeaderText: {
        flex: 1,
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.text.primary,
        textAlign: 'center',
        paddingVertical: 8,
    },
    gridContainer: {
        flex: 1,
        flexDirection: 'row',
    },
    hourColumn: {
        width: 50,
        borderRightWidth: 1,
        borderColor: Colors.border,
    },
    hourSlot: {
        borderBottomWidth: 1,
        borderColor: Colors.border,
        paddingLeft: 4,
    },
    hourText: {
        fontSize: 10,
        color: Colors.text.tertiary,
        marginTop: -6, // Position text on the line
    },
    dayColumn: {
        flex: 1,
        borderRightWidth: 1,
        borderColor: Colors.border,
        position: 'relative', // Needed for absolute positioning of events
    },
    eventContainer: {
        position: 'absolute',
        left: 2,
        right: 2,
    },
});
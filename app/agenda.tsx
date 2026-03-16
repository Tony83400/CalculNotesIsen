import React, { useEffect, useState } from "react";
import {
    FlatList,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ActivityIndicator
} from "react-native";
import { router } from "expo-router";
import { 
    ChevronLeft, 
    ChevronRight, 
    Calendar, 
    ArrowLeft,
    Clock,
    LayoutDashboard,
    Loader2
} from "lucide-react-native";

import CourseCard from "@/components/ui/notes/CourseCard";
import AgendaGrid from "@/components/ui/agenda/AgendaGrid";
import { Colors } from "@/constants/Colors";
import { getAgendaIsen } from "@/services/agendaApi";
import { AgendaEvent } from "@/types/agenda";
import programmerNotifications from "@/utils/notifiations";

export default function AgendaScreen() {
    const [allEvents, setAllEvents] = useState<AgendaEvent[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Initialisation au Lundi de la semaine courante
    const [currentDay, setCurrentDay] = useState<Date>(() => {
        const startweek = new Date();
        const day = startweek.getDay();
        const diff = startweek.getDate() - day + (day === 0 ? -6 : 1); // Ajuste pour obtenir le lundi
        startweek.setDate(diff);
        startweek.setHours(0, 0, 0, 0);
        return startweek; 
    });

    const endOfWeek = new Date(currentDay);
    endOfWeek.setDate(currentDay.getDate() + 5); // Samedi inclus

    const getAgenda = async () => {
        setLoading(true);
        try {
            const rep = await getAgendaIsen();
            // Filtrer les événements pour la semaine sélectionnée
            const startWeek = new Date(currentDay);
            const endWeek = new Date(currentDay);
            endWeek.setDate(endWeek.getDate() + 6);
            endWeek.setHours(23, 59, 59, 999);

            const filtered = rep.filter(event => {
                return event.start >= startWeek && event.start <= endWeek;
            });

            setAllEvents(filtered);
            
            // Format pour les notifications si nécessaire
            const tempAgenda: {day: string, events: AgendaEvent[]}[] = [];
            const days = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
            for (let i = 0; i < 6; i++) {
                const d = new Date(currentDay);
                d.setDate(d.getDate() + i);
                const dayEvents = filtered.filter(e => e.start.toDateString() === d.toDateString());
                tempAgenda.push({ day: d.toDateString(), events: dayEvents });
            }
            programmerNotifications(tempAgenda);
        } catch (error) {
            console.error("Erreur Agenda:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getAgenda();
    }, [currentDay]);

    const changeWeek = (offset: number) => {
        setCurrentDay(prev => {
            const newDate = new Date(prev);
            newDate.setDate(newDate.getDate() + offset);
            return newDate;
        });
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            
            {/* Header Moderne */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.push("/selection")} style={styles.iconBtn}>
                    <ArrowLeft size={22} color={Colors.text.primary} />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle}>Emploi du temps</Text>
                    <View style={styles.weekBadge}>
                        <Calendar size={12} color={Colors.primary} />
                        <Text style={styles.weekBadgeText}>Semaine ISEN</Text>
                    </View>
                </View>
                <TouchableOpacity onPress={() => router.push("/notes")} style={styles.iconBtn}>
                    <LayoutDashboard size={20} color={Colors.text.primary} />
                </TouchableOpacity>
            </View>

            {/* Navigation Semaine : Style Sélecteur épuré */}
            <View style={styles.weekNav}>
                <TouchableOpacity onPress={() => changeWeek(-7)} style={styles.navArrow}>
                    <ChevronLeft size={20} color={Colors.text.secondary} />
                </TouchableOpacity>
                
                <View style={styles.dateDisplay}>
                    <Text style={styles.dateRangeText}>
                        {currentDay.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                        {" — "}
                        {endOfWeek.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </Text>
                </View>

                <TouchableOpacity onPress={() => changeWeek(7)} style={styles.navArrow}>
                    <ChevronRight size={20} color={Colors.text.secondary} />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.loaderContainer}>
                    <Loader2 size={40} color={Colors.primary} style={styles.spinner} />
                    <Text style={styles.loaderText}>Chargement de votre planning...</Text>
                </View>
            ) : (
                <AgendaGrid events={allEvents} startDay={currentDay} />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: Colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    iconBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: Colors.background,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitleContainer: {
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: Colors.text.primary,
        letterSpacing: -0.5,
    },
    weekBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.primaryLight,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 20,
        marginTop: 4,
        gap: 4,
    },
    weekBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: Colors.primary,
        textTransform: 'uppercase',
    },
    weekNav: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        // Petite ombre portée
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 2,
    },
    navArrow: {
        padding: 8,
        borderRadius: 10,
        backgroundColor: Colors.background,
    },
    dateDisplay: {
        backgroundColor: Colors.background,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    dateRangeText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text.primary,
        textTransform: 'capitalize',
    },
    listContent: {
        padding: 16,
        paddingBottom: 40,
    },
    daySection: {
        marginBottom: 24,
    },
    dayHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 8,
    },
    dayTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.text.secondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    todayTitle: {
        color: Colors.primary,
    },
    todayBadge: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    todayBadgeText: {
        color: '#FFF',
        fontSize: 9,
        fontWeight: '800',
    },
    dayLine: {
        flex: 1,
        height: 1,
        backgroundColor: Colors.divider,
    },
    eventsContainer: {
        gap: 0,
    },
    emptyContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingLeft: 4,
    },
    noClassText: {
        fontStyle: 'italic',
        color: Colors.text.tertiary,
        fontSize: 14,
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    spinner: {
        marginBottom: 16,
    },
    loaderText: {
        fontSize: 15,
        color: Colors.text.secondary,
        fontWeight: '500',
    }
});
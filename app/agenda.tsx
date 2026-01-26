import CourseCard from "@/components/ui/notes/CourseCard";
import { Colors } from "@/constants/Colors";
import { getAgendaIsen } from "@/services/agendaApi";
import { AgendaEvent } from "@/types/agenda";
import programmerNotifications from "@/utils/notifiations";
import { Ionicons } from '@expo/vector-icons';
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    FlatList,
    Platform,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";

export interface AgendaProps {
    events: AgendaEvent[];
    day: string; 
}

export default function Agenda() {
    const [courses, setCourses] = useState<AgendaProps[]>([]);
    const days = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
    
    // Initialisation au Lundi de la semaine courante
    const [currentDay, setCurrentDay] = useState<Date>(() => {
        const startweek = new Date();
        startweek.setDate(startweek.getDate() - startweek.getDay() + 1);
        startweek.setHours(0, 0, 0, 0);
        return startweek; 
    });

    // Calcul de la date de fin de semaine pour l'affichage (Lundi + 6 jours = Dimanche)
    const endOfWeek = new Date(currentDay);
    endOfWeek.setDate(currentDay.getDate() + 6);

    const getAgenda = async () => {
        const rep = await getAgendaIsen();
        const tempAgenda: AgendaProps[] = [];
        
        for (let i = 0; i < days.length; i++) {
            const startDay = new Date(currentDay);
            startDay.setDate(startDay.getDate() + i);
            const endDay = new Date(startDay);
            endDay.setHours(23, 59, 59, 999);
            
            // Formatage de la date (ex: 12/02)
            const dateFormatted = startDay.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
            const dayLabel = `${days[i]} ${dateFormatted}`;

            // Filtrage et tri
            const filtered = rep.filter(event => {
                return event.start >= startDay && event.end <= endDay;
            }).sort((a, b) => a.start.getTime() - b.start.getTime());

            const newDay: AgendaProps = {
                day: dayLabel,
                events: filtered
            }
            tempAgenda.push(newDay);
        }
        console.log(tempAgenda);
        setCourses(tempAgenda);
        // On programme les notifications après avoir récupéré les cours
        programmerNotifications(tempAgenda);
    };

    // Recharger l'agenda quand la semaine change (currentDay)
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

    if (!courses) {
        return(<View>
            <Text>Chargement ....</Text>
        </View>);
    }
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            
            {/* Header Principal */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.push("/selection")} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Emploi du temps</Text>
                <View style={{ width: 40 }} /> 
            </View>

            {/* Barre de navigation Semaine */}
            <View style={styles.weekNavContainer}>
                <TouchableOpacity onPress={() => changeWeek(-7)} style={styles.navButton}>
                    <Ionicons name="chevron-back" size={20} color={Colors.primary} />
                </TouchableOpacity>
                
                <View style={styles.dateRangeContainer}>
                    <Ionicons name="calendar-outline" size={16} color={Colors.text.secondary} style={{marginRight: 6}} />
                    <Text style={styles.dateRangeText}>
                        {currentDay.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                        {" - "}
                        {endOfWeek.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                    </Text>
                </View>

                <TouchableOpacity onPress={() => changeWeek(7)} style={styles.navButton}>
                    <Ionicons name="chevron-forward" size={20} color={Colors.primary} />
                </TouchableOpacity>
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
        backgroundColor: Colors.background,
    },
    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0', // Plus léger
        marginTop: Platform.OS === 'android' ? 30 : 0,
    },
    backButton: {
        padding: 8,
        borderRadius: 50,
        backgroundColor: '#F5F5F5',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text.primary,
    },
    
    // Navigation Semaine (Nouveau Style)
    weekNavContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingVertical: 10,
        paddingHorizontal: 20,
        marginBottom: 10,
        // Ombre légère pour séparer du contenu
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    navButton: {
        padding: 8,
        backgroundColor: Colors.primaryLight, // Fond léger basé sur la couleur primaire
        borderRadius: 8,
    },
    dateRangeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    dateRangeText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text.primary,
        textTransform: 'capitalize', // Met la première lettre du mois en majuscule
    },

    // Liste et Jours
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
        fontSize: 18, // Légèrement réduit pour accomoder la date
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

});
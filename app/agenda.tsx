import React from "react";
import {
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { 
    ChevronLeft, 
    ChevronRight, 
    Calendar, 
    Home,
    GraduationCap,
    Loader2,
    CalendarDays,
    CalendarRange,
    RefreshCw
} from "lucide-react-native";

import AgendaGrid from "@/components/ui/agenda/AgendaGrid";
import DailyAgenda from "@/components/ui/agenda/DailyAgenda";
import { Colors } from "@/constants/Colors";
import { useAgenda } from "@/hooks/useAgenda";
import { isTokenExpired, canSilentLogin } from "@/services/storage";

export default function AgendaScreen() {
    useFocusEffect(
        React.useCallback(() => {
            const checkSession = async () => {
                const expired = await isTokenExpired();
                const canSilent = await canSilentLogin();
                if (expired && !canSilent) {
                    router.replace("/");
                }
            };
            checkSession();
        }, [])
    );
    const {
        allEvents,
        weekEvents,
        loading,
        error,
        viewMode,
        currentDay,
        selectedDate,
        endOfWeek,
        changeDate,
        toggleViewMode,
        refresh
    } = useAgenda();

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            
            {/* Header Moderne */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.push("/selection")} style={styles.iconBtn}>
                    <Home size={22} color={Colors.text.primary} />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle}>Emploi du temps</Text>
                    <View style={styles.weekBadge}>
                        <Calendar size={12} color={Colors.primary} />
                        <Text style={styles.weekBadgeText}>Semaine ISEN</Text>
                    </View>
                </View>
                <TouchableOpacity onPress={() => router.push("/notes")} style={styles.iconBtn}>
                    <GraduationCap size={22} color={Colors.text.primary} />
                </TouchableOpacity>
            </View>

            {/* Sélecteur de Vue & Navigation */}
            <View style={styles.navContainer}>
                <View style={styles.viewToggle}>
                    <TouchableOpacity 
                        onPress={() => viewMode !== 'day' && toggleViewMode()}
                        style={[styles.toggleBtn, viewMode === 'day' && styles.toggleBtnActive]}
                    >
                        <CalendarDays size={16} color={viewMode === 'day' ? '#FFF' : Colors.text.secondary} />
                        <Text style={[styles.toggleBtnText, viewMode === 'day' && styles.toggleBtnTextActive]}>Jour</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        onPress={() => viewMode !== 'week' && toggleViewMode()}
                        style={[styles.toggleBtn, viewMode === 'week' && styles.toggleBtnActive]}
                    >
                        <CalendarRange size={16} color={viewMode === 'week' ? '#FFF' : Colors.text.secondary} />
                        <Text style={[styles.toggleBtnText, viewMode === 'week' && styles.toggleBtnTextActive]}>Semaine</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.weekNav}>
                    <TouchableOpacity onPress={() => changeDate(viewMode === 'week' ? -7 : -1)} style={styles.navArrow}>
                        <ChevronLeft size={20} color={Colors.text.secondary} />
                    </TouchableOpacity>
                    
                    <View style={styles.dateDisplay}>
                        <Text style={styles.dateRangeText}>
                            {viewMode === 'week' ? (
                                `${currentDay.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} — ${endOfWeek.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`
                            ) : (
                                selectedDate.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long' })
                            )}
                        </Text>
                    </View>

                    <TouchableOpacity onPress={() => changeDate(viewMode === 'week' ? 7 : 1)} style={styles.navArrow}>
                        <ChevronRight size={20} color={Colors.text.secondary} />
                    </TouchableOpacity>
                </View>
            </View>

            {loading ? (
                <View style={styles.loaderContainer}>
                    <Loader2 size={40} color={Colors.primary} style={styles.spinner} />
                    <Text style={styles.loaderText}>Chargement de votre planning...</Text>
                </View>
            ) : error ? (
                <View style={styles.loaderContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.refreshBtn} onPress={refresh}>
                        <RefreshCw size={20} color="#FFF" />
                        <Text style={styles.refreshBtnText}>Réessayer</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                viewMode === 'week' ? (
                    <AgendaGrid events={weekEvents} startDay={currentDay} />
                ) : (
                    <DailyAgenda events={allEvents} selectedDate={selectedDate} />
                )
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
    navContainer: {
        backgroundColor: Colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        paddingBottom: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 2,
    },
    viewToggle: {
        flexDirection: 'row',
        backgroundColor: Colors.background,
        marginHorizontal: 16,
        marginTop: 12,
        marginBottom: 8,
        borderRadius: 12,
        padding: 4,
        gap: 4,
    },
    toggleBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        borderRadius: 8,
        gap: 6,
    },
    toggleBtnActive: {
        backgroundColor: Colors.primary,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    toggleBtnText: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.text.secondary,
    },
    toggleBtnTextActive: {
        color: '#FFF',
    },
    weekNav: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 4,
    },
    navArrow: {
        padding: 8,
        borderRadius: 10,
        backgroundColor: Colors.background,
    },
    dateDisplay: {
        flex: 1,
        marginHorizontal: 12,
        backgroundColor: Colors.background,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border,
        alignItems: 'center',
    },
    dateRangeText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text.primary,
        textTransform: 'capitalize',
        textAlign: 'center',
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
    },
    errorText: {
        fontSize: 15,
        color: Colors.status.error,
        fontWeight: '600',
        marginBottom: 20,
        textAlign: 'center',
    },
    refreshBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.primary,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
    },
    refreshBtnText: {
        color: '#FFF',
        fontWeight: '700',
        fontSize: 15,
    }
});
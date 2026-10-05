import React, { useState } from "react";
import {
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    TextInput,
    ScrollView
} from "react-native";
import { router } from "expo-router";
import { 
    ChevronLeft, 
    ChevronRight, 
    Home,
    Loader2,
    CalendarDays,
    CalendarRange,
    RefreshCw,
    Plus,
    X,
    Users,
    Info
} from "lucide-react-native";

import AgendaGrid from "@/components/ui/agenda/AgendaGrid";
import DailyAgenda from "@/components/ui/agenda/DailyAgenda";
import { Colors } from "@/constants/Colors";
import { useMultiAgenda } from "@/hooks/useMultiAgenda";

export default function MultiAgendaScreen() {
    const {
        users,
        addUser,
        removeUser,
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
        refresh,
        searchError,
        setSearchError,
        recentUsers,
        removeRecentUser
    } = useMultiAgenda();

    const [prenom, setPrenom] = useState("");
    const [nom, setNom] = useState("");

    const handleAddUser = () => {
        if (prenom && nom) {
            addUser(prenom, nom);
            setPrenom("");
            setNom("");
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.push("/selection")} style={styles.iconBtn}>
                    <ChevronLeft size={24} color={Colors.text.primary} />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle}>Agendas Multiples</Text>
                    <View style={styles.weekBadge}>
                        <Users size={12} color={Colors.status.success} />
                        <Text style={styles.weekBadgeText}>Comparaison</Text>
                    </View>
                </View>
                <View style={{width: 40}} />
            </View>

            {/* Barre d'ajout utilisateur */}
            <View style={styles.addUserContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Prénom"
                    value={prenom}
                    onChangeText={setPrenom}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Nom"
                    value={nom}
                    onChangeText={setNom}
                />
                <TouchableOpacity style={styles.addBtn} onPress={handleAddUser}>
                    <Plus size={20} color="#FFF" />
                </TouchableOpacity>
            </View>

            {/* Error Box */}
            {searchError && (
                <View style={styles.searchErrorBox}>
                    <Info size={16} color={Colors.status.error} />
                    <Text style={styles.searchErrorText}>{searchError}</Text>
                    <TouchableOpacity onPress={() => setSearchError(null)}>
                        <X size={16} color={Colors.status.error} />
                    </TouchableOpacity>
                </View>
            )}

            {/* Historique des récents */}
            {recentUsers.length > 0 && (
                <View style={styles.recentUsersContainer}>
                    <Text style={styles.recentUsersTitle}>Recherches récentes</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recentUsersList}>
                        {recentUsers.map(ru => (
                            <TouchableOpacity 
                                key={ru.id} 
                                style={styles.recentUserBadge}
                                onPress={() => {
                                    addUser(ru.prenom, ru.nom);
                                    setPrenom("");
                                    setNom("");
                                }}
                            >
                                <Text style={styles.recentUserText}>{ru.prenom} {ru.nom}</Text>
                                <TouchableOpacity onPress={() => removeRecentUser(ru.id)} style={styles.recentRemoveBtn}>
                                    <X size={12} color={Colors.text.secondary} />
                                </TouchableOpacity>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}

            {/* Liste des utilisateurs */}
            {users.length > 0 && (
                <View style={styles.usersListContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.usersList}>
                        {users.map((u) => (
                            <View key={u.id} style={[styles.userBadge, { backgroundColor: u.color + '20', borderColor: u.color }]}>
                                <View style={[styles.userColorDot, { backgroundColor: u.color }]} />
                                <Text style={[styles.userBadgeText, { color: u.color }]}>{u.prenom} {u.nom}</Text>
                                <TouchableOpacity onPress={() => removeUser(u.id)} style={styles.removeUserBtn}>
                                    <X size={14} color={u.color} />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </ScrollView>
                </View>
            )}

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
                    <Loader2 size={40} color={Colors.status.success} style={styles.spinner} />
                    <Text style={styles.loaderText}>Chargement des plannings...</Text>
                </View>
            ) : error ? (
                <View style={styles.loaderContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.refreshBtn} onPress={refresh}>
                        <RefreshCw size={20} color="#FFF" />
                        <Text style={styles.refreshBtnText}>Réessayer</Text>
                    </TouchableOpacity>
                </View>
            ) : users.length === 0 ? (
                <View style={styles.loaderContainer}>
                    <Users size={48} color={Colors.text.tertiary} style={{marginBottom: 16}} />
                    <Text style={styles.loaderText}>Ajoutez une personne pour voir son emploi du temps.</Text>
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
        backgroundColor: Colors.status.success + '15',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 20,
        marginTop: 4,
        gap: 4,
    },
    weekBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: Colors.status.success,
        textTransform: 'uppercase',
    },
    addUserContainer: {
        flexDirection: 'row',
        padding: 12,
        gap: 8,
        backgroundColor: Colors.surface,
    },
    input: {
        flex: 1,
        backgroundColor: Colors.background,
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 44,
        borderWidth: 1,
        borderColor: Colors.border,
        color: Colors.text.primary,
        fontWeight: '500',
    },
    addBtn: {
        width: 44,
        height: 44,
        backgroundColor: Colors.status.success,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: Colors.status.success,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 2,
    },
    searchErrorBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.status.error + '15',
        marginHorizontal: 16,
        marginBottom: 12,
        padding: 12,
        borderRadius: 12,
        gap: 8,
    },
    searchErrorText: {
        flex: 1,
        fontSize: 13,
        fontWeight: '500',
        color: Colors.status.error,
    },
    recentUsersContainer: {
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    recentUsersTitle: {
        fontSize: 11,
        fontWeight: '700',
        color: Colors.text.tertiary,
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    recentUsersList: {
        gap: 8,
        paddingRight: 16,
    },
    recentUserBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.background,
        borderWidth: 1,
        borderColor: Colors.border,
        paddingVertical: 6,
        paddingLeft: 12,
        paddingRight: 6,
        borderRadius: 16,
        gap: 6,
    },
    recentUserText: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.text.secondary,
        textTransform: 'capitalize',
    },
    recentRemoveBtn: {
        padding: 4,
        backgroundColor: Colors.surface,
        borderRadius: 10,
    },
    usersListContainer: {
        backgroundColor: Colors.surface,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    usersList: {
        paddingHorizontal: 12,
        gap: 8,
    },
    userBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingLeft: 10,
        paddingRight: 6,
        borderRadius: 16,
        borderWidth: 1,
        gap: 6,
    },
    userColorDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    userBadgeText: {
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'capitalize',
    },
    removeUserBtn: {
        padding: 4,
        backgroundColor: '#FFF',
        borderRadius: 10,
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
        backgroundColor: Colors.status.success,
        shadowColor: Colors.status.success,
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
        textAlign: 'center',
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
        backgroundColor: Colors.status.success,
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

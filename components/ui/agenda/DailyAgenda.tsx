import React, { useState } from "react";
import { 
    StyleSheet, 
    View, 
    Text, 
    FlatList, 
    TouchableOpacity, 
    Modal, 
    Pressable 
} from "react-native";
import { Colors } from "@/constants/Colors";
import { AgendaEvent } from "@/types/agenda";
import { Clock, MapPin, X, Calendar as CalendarIcon, AlertCircle } from "lucide-react-native";

interface DailyAgendaProps {
    events: AgendaEvent[];
    selectedDate: Date;
}

export default function DailyAgenda({ events, selectedDate }: DailyAgendaProps) {
    const [selectedEvent, setSelectedEvent] = useState<AgendaEvent | null>(null);

    // Filtrer les événements pour le jour sélectionné
    const dailyEvents = events
        .filter(event => {
            const eventDate = new Date(event.start);
            return eventDate.toDateString() === selectedDate.toDateString();
        })
        .sort((a, b) => a.start.getTime() - b.start.getTime());

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

    const renderEventItem = ({ item }: { item: AgendaEvent }) => {
        const isExam = item.isExam;

        return (
            <TouchableOpacity 
                activeOpacity={0.7}
                onPress={() => setSelectedEvent(item)}
                style={[
                    styles.eventCard,
                    isExam ? styles.examCard : styles.regularCard
                ]}
            >
                <View style={styles.timeContainer}>
                    <Text style={[styles.timeText, isExam && styles.examText]}>{formatTime(item.start)}</Text>
                    <View style={[styles.timeLine, isExam ? styles.examLine : styles.regularLine]} />
                    <Text style={[styles.timeText, isExam && styles.examText]}>{formatTime(item.end)}</Text>
                </View>

                <View style={styles.contentContainer}>
                    {isExam && (
                        <View style={styles.examBadge}>
                            <AlertCircle size={10} color={Colors.status.error} />
                            <Text style={styles.examBadgeText}>EXAMEN</Text>
                        </View>
                    )}
                    <Text style={[styles.eventTitle, isExam && styles.examText]} numberOfLines={2}>
                        {item.title}
                    </Text>
                    
                    <View style={styles.infoRow}>
                        <MapPin size={14} color={isExam ? Colors.status.error : Colors.text.tertiary} />
                        <Text style={[styles.infoText, isExam && styles.examText]} numberOfLines={1}>
                            {item.location}
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
                <CalendarIcon size={48} color={Colors.text.tertiary} strokeWidth={1.5} />
            </View>
            <Text style={styles.emptyTitle}>Aucun cours prévu</Text>
            <Text style={styles.emptySubtitle}>Profitez de votre temps libre !</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <FlatList
                data={dailyEvents}
                keyExtractor={(item, index) => item.id || index.toString()}
                renderItem={renderEventItem}
                ListEmptyComponent={renderEmpty}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            />

            {/* Modal de Détails (Réutilisé de AgendaGrid pour la cohérence) */}
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
        backgroundColor: Colors.background,
    },
    listContent: {
        padding: 16,
        paddingBottom: 32,
        gap: 16,
    },
    eventCard: {
        flexDirection: 'row',
        backgroundColor: Colors.surface,
        borderRadius: 24,
        padding: 16,
        // Premium Shadow
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
        elevation: 3,
    },
    regularCard: {
        borderLeftWidth: 6,
        borderLeftColor: Colors.primary,
    },
    examCard: {
        borderLeftWidth: 6,
        borderLeftColor: Colors.status.error,
        backgroundColor: Colors.status.error + '05',
    },
    timeContainer: {
        width: 60,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    timeText: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.text.primary,
    },
    timeLine: {
        width: 2,
        height: 20,
        marginVertical: 4,
        borderRadius: 1,
    },
    regularLine: {
        backgroundColor: Colors.primary + '30',
    },
    examLine: {
        backgroundColor: Colors.status.error + '30',
    },
    contentContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    examBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.status.error + '10',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        alignSelf: 'flex-start',
        marginBottom: 6,
        gap: 4,
    },
    examBadgeText: {
        fontSize: 9,
        fontWeight: '800',
        color: Colors.status.error,
    },
    eventTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text.primary,
        marginBottom: 8,
        lineHeight: 20,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    infoText: {
        fontSize: 13,
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
        paddingVertical: 80,
    },
    emptyIconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: Colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: Colors.text.primary,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.text.tertiary,
    },
    // Modal Styles (Consistency)
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
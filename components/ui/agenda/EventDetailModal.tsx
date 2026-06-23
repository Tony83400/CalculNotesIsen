import React, { useEffect, useState } from "react";
import { 
    StyleSheet, 
    View, 
    Text, 
    TouchableOpacity, 
    Modal, 
    Pressable,
    ActivityIndicator,
    ScrollView
} from "react-native";
import { Clock, MapPin, X, Users, BookOpen, Tag, Info } from "lucide-react-native";
import { Colors } from "@/constants/Colors";
import { AgendaEvent, EventDetails } from "@/types/agenda";
import { formatTime, formatFullDate } from "@/utils/agenda";
import { getEventIdByTime, getEventDetails } from "@/services/isenApi";

interface EventDetailModalProps {
    event: AgendaEvent | null;
    visible: boolean;
    onClose: () => void;
}

export default function EventDetailModal({ event, visible, onClose }: EventDetailModalProps) {
    const [loading, setLoading] = useState(false);
    const [details, setDetails] = useState<EventDetails | null>(null);

    useEffect(() => {
        if (visible && event) {
            loadDetails();
        } else {
            setDetails(null);
        }
    }, [visible, event]);

    const loadDetails = async () => {
        if (!event) return;
        setLoading(true);
        try {
            const startTs = event.start.getTime();
            const endTs = event.end.getTime();
            const eventId = await getEventIdByTime(startTs, endTs);
            
            if (eventId) {
                const detailedInfo = await getEventDetails(eventId);
                setDetails(detailedInfo);
            }
        } catch (error) {
            console.error("Erreur lors du chargement des détails :", error);
        } finally {
            setLoading(false);
        }
    };

    if (!event) return null;

    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            onRequestClose={onClose}
        >
            <Pressable 
                style={styles.modalOverlay} 
                onPress={onClose}
            >
                <View style={styles.modalContent}>
                    <View style={[
                        styles.modalHeader,
                        event.isExam ? styles.examModalHeader : styles.regularModalHeader
                    ]}>
                        <View style={{ flex: 1 }}>
                            {event.isExam && <Text style={styles.examLabelModal}>EXAMEN</Text>}
                            <ScrollView 
                                nestedScrollEnabled={true} 
                                style={{ maxHeight: 75 }}
                                showsVerticalScrollIndicator={true}
                            >
                                <Text style={styles.modalTitle}>{event.title}</Text>
                            </ScrollView>
                        </View>
                        <TouchableOpacity 
                            onPress={onClose}
                            style={styles.closeButton}
                        >
                            <X size={24} color={Colors.text.secondary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView bounces={false} contentContainerStyle={{ paddingBottom: 16 }}>
                        <View style={styles.modalBody}>
                            <View style={styles.detailItem}>
                                <Clock size={20} color={Colors.primary} style={styles.detailIcon} />
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.detailLabel}>Horaire</Text>
                                    <Text style={styles.detailValue}>
                                        {formatFullDate(event.start)}
                                    </Text>
                                    <Text style={styles.detailSubValue}>
                                        {formatTime(event.start)} - {formatTime(event.end)}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.detailItem}>
                                <MapPin size={20} color={Colors.primary} style={styles.detailIcon} />
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.detailLabel}>Lieu</Text>
                                    <Text style={styles.detailValue}>{event.location}</Text>
                                </View>
                            </View>

                            {loading ? (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator color={Colors.primary} />
                                    <Text style={styles.loadingText}>Chargement des détails...</Text>
                                </View>
                            ) : details ? (
                                <>
                                    <View style={styles.detailItem}>
                                        <BookOpen size={20} color={Colors.primary} style={styles.detailIcon} />
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.detailLabel}>Module</Text>
                                            <Text style={styles.detailValue}>{details.module || 'Non défini'}</Text>
                                        </View>
                                    </View>

                                    <View style={styles.detailItem}>
                                        <Tag size={20} color={Colors.primary} style={styles.detailIcon} />
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.detailLabel}>Groupe</Text>
                                            <Text style={styles.detailValue}>
                                                {details.type || ''} {
                                                    (details.groups?.length ?? 0) > 1 
                                                    ? `- ${details.groups?.[1]}` 
                                                    : ((details.groups?.length ?? 0) > 0 ? `- ${details.groups?.[0]}` : '')
                                                }
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={styles.detailItem}>
                                        <Info size={20} color={Colors.primary} style={styles.detailIcon} />
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.detailLabel}>Enseignants</Text>
                                            <Text style={styles.detailValue}>
                                                {(details.teachers?.length ?? 0) > 0 ? details.teachers?.join(', ') : 'Non défini'}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={styles.detailItem}>
                                        <Users size={20} color={Colors.primary} style={styles.detailIcon} />
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.detailLabel}>Étudiants ({details.students?.length ?? 0})</Text>
                                            <View style={[
                                                styles.studentsListContainer,
                                                { maxHeight: (details.students?.length ?? 0) > 5 ? 180 : undefined }
                                            ]}>
                                                <ScrollView 
                                                    nestedScrollEnabled={true} 
                                                    style={styles.studentsScrollView}
                                                    showsVerticalScrollIndicator={(details.students?.length ?? 0) > 5}
                                                >
                                                    <View style={styles.studentsList}>
                                                        {(details.students ?? []).map((student, index) => (
                                                            <Text key={index} style={styles.studentName}>
                                                                • {student}
                                                            </Text>
                                                        ))}
                                                    </View>
                                                </ScrollView>
                                            </View>
                                        </View>
                                    </View>
                                </>
                            ) : !loading && (
                                <View style={styles.noDetailsContainer}>
                                    <Text style={styles.noDetailsText}>Détails non disponibles pour ce cours.</Text>
                                </View>
                            )}
                        </View>
                    </ScrollView>
                </View>
            </Pressable>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalContent: {
        width: '100%',
        maxWidth: 500,
        maxHeight: '85%',
        alignSelf: 'center',
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
        paddingTop: 16,
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
    },
    loadingContainer: {
        paddingVertical: 20,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 12,
    },
    loadingText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text.tertiary,
    },
    studentsListContainer: {
        marginTop: 8,
        backgroundColor: Colors.background,
        borderRadius: 12,
        overflow: 'hidden',
    },
    studentsScrollView: {
        padding: 12,
    },
    studentsList: {
        gap: 4,
    },
    studentName: {
        fontSize: 13,
        fontWeight: '500',
        color: Colors.text.secondary,
    },
    noDetailsContainer: {
        paddingVertical: 10,
        alignItems: 'center',
    },
    noDetailsText: {
        fontSize: 14,
        color: Colors.text.tertiary,
        fontStyle: 'italic',
    }
});

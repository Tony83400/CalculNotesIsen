import React from "react";
import { 
    StyleSheet, 
    View, 
    Text, 
    TouchableOpacity, 
    Modal, 
    Pressable 
} from "react-native";
import { Clock, MapPin, X } from "lucide-react-native";
import { Colors } from "@/constants/Colors";
import { AgendaEvent } from "@/types/agenda";
import { formatTime, formatFullDate } from "@/utils/agenda";

interface EventDetailModalProps {
    event: AgendaEvent | null;
    visible: boolean;
    onClose: () => void;
}

export default function EventDetailModal({ event, visible, onClose }: EventDetailModalProps) {
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
                            <Text style={styles.modalTitle}>{event.title}</Text>
                        </View>
                        <TouchableOpacity 
                            onPress={onClose}
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
                                    {formatFullDate(event.start)}
                                </Text>
                                <Text style={styles.detailSubValue}>
                                    {formatTime(event.start)} - {formatTime(event.end)}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.detailItem}>
                            <MapPin size={20} color={Colors.primary} style={styles.detailIcon} />
                            <View>
                                <Text style={styles.detailLabel}>Lieu</Text>
                                <Text style={styles.detailValue}>{event.location}</Text>
                            </View>
                        </View>
                    </View>
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
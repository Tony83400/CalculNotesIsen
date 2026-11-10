import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import {
  Clock,
  MapPin,
  X,
  Users,
  BookOpen,
  Tag,
  Info,
} from "lucide-react-native";
import { Colors } from "@/constants/Colors";
import { AgendaEvent, EventDetails } from "@/types/agenda";
import { formatTime, formatFullDate } from "@/utils/agenda";
import { getEventIdByTime, getEventDetails } from "@/services/isenApi";

interface EventDetailModalProps {
  event: AgendaEvent | null;
  visible: boolean;
  onClose: () => void;
  hideDetails?: boolean;
}

export default function EventDetailModal({
  event,
  visible,
  onClose,
  hideDetails = false,
}: EventDetailModalProps) {
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState<EventDetails | null>(null);

  const shouldHideDetails = hideDetails || !!event?.userName;

  useEffect(() => {
    let active = true;
    const abort = new AbortController();

    if (visible && event && !shouldHideDetails) {
      setLoading(true);
      (async () => {
        try {
          const startTs = event.start.getTime();
          const endTs = event.end.getTime();
          const eventId = await getEventIdByTime(startTs, endTs, abort.signal);

          if (eventId && active) {
            const detailedInfo = await getEventDetails(eventId, abort.signal);
            if (active) setDetails(detailedInfo);
          }
        } catch (error) {
          if (active) {
            console.error("Erreur lors du chargement des détails :", error);
          }
        } finally {
          if (active) setLoading(false);
        }
      })();
    } else {
      setDetails(null);
      setLoading(false);
    }

    return () => {
      active = false;
      abort.abort();
    };
  }, [visible, event, shouldHideDetails]);

  if (!event) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <View style={styles.modalContent}>
          <View
            style={[
              styles.modalHeader,
              event.isExam
                ? styles.examModalHeader
                : styles.regularModalHeader,
            ]}
          >
            <View style={{ flex: 1 }}>
              {event.isExam && (
                <Text style={styles.examLabelModal}>EXAMEN</Text>
              )}
              {event.userName && (
                <View
                  style={[
                    styles.examBadgeModal,
                    { backgroundColor: event.color + "20" },
                  ]}
                >
                  <Text
                    style={[
                      styles.examBadgeTextModal,
                      { color: event.color },
                    ]}
                  >
                    {event.userName.toUpperCase()}
                  </Text>
                </View>
              )}
              <ScrollView
                nestedScrollEnabled={true}
                style={{ maxHeight: 75 }}
                showsVerticalScrollIndicator={true}
              >
                <Text style={styles.modalTitle}>{event.title}</Text>
              </ScrollView>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={Colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            bounces={false}
            contentContainerStyle={{ paddingBottom: 16 }}
          >
            <View style={styles.modalBody}>
              <View style={styles.detailItem}>
                <Clock
                  size={20}
                  color={Colors.primary}
                  style={styles.detailIcon}
                />
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
                <MapPin
                  size={20}
                  color={Colors.primary}
                  style={styles.detailIcon}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.detailLabel}>Lieu</Text>
                  <Text style={styles.detailValue}>
                    {event.location || "Non défini"}
                  </Text>
                </View>
              </View>

              {event.professors ? (
                <View style={styles.detailItem}>
                  <Users
                    size={20}
                    color={Colors.primary}
                    style={styles.detailIcon}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.detailLabel}>Enseignant(s)</Text>
                    <Text style={styles.detailValue}>{event.professors}</Text>
                  </View>
                </View>
              ) : null}

              {!shouldHideDetails && (
                loading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={Colors.primary} />
                    <Text style={styles.loadingText}>
                      Chargement des détails ISEN...
                    </Text>
                  </View>
                ) : details ? (
                  <>
                    {details.module ? (
                      <View style={styles.detailItem}>
                        <BookOpen
                          size={20}
                          color={Colors.primary}
                          style={styles.detailIcon}
                        />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.detailLabel}>Module</Text>
                          <Text style={styles.detailValue}>
                            {details.module}
                          </Text>
                        </View>
                      </View>
                    ) : null}

                    {details.subject && details.subject !== event.title ? (
                      <View style={styles.detailItem}>
                        <Tag
                          size={20}
                          color={Colors.primary}
                          style={styles.detailIcon}
                        />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.detailLabel}>Matière</Text>
                          <Text style={styles.detailValue}>
                            {details.subject}
                          </Text>
                        </View>
                      </View>
                    ) : null}

                    {details.type ? (
                      <View style={styles.detailItem}>
                        <Info
                          size={20}
                          color={Colors.primary}
                          style={styles.detailIcon}
                        />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.detailLabel}>Type de cours</Text>
                          <Text style={styles.detailValue}>
                            {details.type}
                          </Text>
                        </View>
                      </View>
                    ) : null}

                    {details.teachers && details.teachers.length > 0 && (
                      <View style={styles.detailItem}>
                        <Users
                          size={20}
                          color={Colors.primary}
                          style={styles.detailIcon}
                        />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.detailLabel}>Intervenant(s)</Text>
                          <Text style={styles.detailValue}>
                            {details.teachers.join(", ")}
                          </Text>
                        </View>
                      </View>
                    )}

                    {details.groups && details.groups.length > 0 && (
                      <View style={styles.detailItem}>
                        <Users
                          size={20}
                          color={Colors.primary}
                          style={styles.detailIcon}
                        />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.detailLabel}>Groupe(s)</Text>
                          <Text style={styles.detailValue}>
                            {details.groups.join(", ")}
                          </Text>
                        </View>
                      </View>
                    )}

                    <View style={styles.detailItem}>
                      <Users
                        size={20}
                        color={Colors.primary}
                        style={styles.detailIcon}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.detailLabel}>
                          Étudiants présents ({details.students?.length ?? 0})
                        </Text>
                        <View style={styles.studentsListContainer}>
                          <ScrollView
                            nestedScrollEnabled={true}
                            style={styles.studentsScrollView}
                            showsVerticalScrollIndicator={
                              (details.students?.length ?? 0) > 5
                            }
                          >
                            <View style={styles.studentsList}>
                              {(details.students ?? []).map((student: string, index: number) => (
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
                ) : (
                  <View style={styles.noDetailsContainer}>
                    <Text style={styles.noDetailsText}>
                      Détails non disponibles pour ce cours.
                    </Text>
                  </View>
                )
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
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    maxWidth: 450,
    maxHeight: "80%",
    alignSelf: "center",
    backgroundColor: Colors.surface,
    borderRadius: 20,
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
  },
  modalHeader: {
    padding: 20,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  regularModalHeader: {
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.divider,
  },
  examModalHeader: {
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.divider,
    backgroundColor: "#FFF1F2",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text.primary,
    lineHeight: 24,
    letterSpacing: -0.3,
  },
  examLabelModal: {
    fontSize: 9,
    fontWeight: "800",
    color: Colors.status.error,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  examBadgeModal: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  examBadgeTextModal: {
    fontSize: 10,
    fontWeight: "800",
  },
  closeButton: {
    padding: 4,
    marginLeft: 12,
    borderRadius: 14,
    backgroundColor: Colors.background,
  },
  modalBody: {
    padding: 20,
    paddingTop: 16,
    gap: 20,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  detailIcon: {
    marginTop: 2,
    marginRight: 12,
  },
  detailLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: Colors.text.tertiary,
    textTransform: "uppercase",
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.text.primary,
  },
  detailSubValue: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.primary,
    marginTop: 1,
  },
  loadingContainer: {
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text.tertiary,
  },
  studentsListContainer: {
    marginTop: 6,
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: Colors.divider,
    overflow: "hidden",
  },
  studentsScrollView: {
    padding: 10,
  },
  studentsList: {
    gap: 3,
  },
  studentName: {
    fontSize: 12,
    fontWeight: "500",
    color: Colors.text.secondary,
  },
  noDetailsContainer: {
    paddingVertical: 10,
    alignItems: "center",
  },
  noDetailsText: {
    fontSize: 13,
    color: Colors.text.tertiary,
    fontStyle: "italic",
  },
});

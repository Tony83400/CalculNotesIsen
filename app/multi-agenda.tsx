import React, { useRef, useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import AppShell from "../components/AppShell";
import { useMultiAgenda } from "../hooks/useMultiAgenda";
import CalendarToolbar from "../components/ui/agenda/CalendarToolbar";
import AgendaGrid from "../components/ui/agenda/AgendaGrid";
import { Button, Empty, Field, Notice, ui } from "../components/ui/Primitives";
import { Colors as C } from "../constants/Colors";
export default function MultiAgenda() {
  const c = useMultiAgenda(),
    [prenom, setPrenom] = useState(""),
    [nom, setNom] = useState(""),
    nomRef = useRef<TextInput>(null);
  const add = () => {
    void c.addUser(prenom, nom);
  };
  return (
    <AppShell
      title="Comparer les agendas"
      kicker="Emplois du temps"
      actions={
        <Button
          label="Actualiser les agendas"
          loading={c.loading}
          onPress={c.refresh}
        />
      }
    >
      <Text style={[ui.small, { marginBottom: 24 }]}>
        Ajoutez une personne avec le prénom et le nom utilisés dans son
        identifiant ISEN. Seuls les horaires sont comparés ; aucun détail
        personnel n’est recherché avec votre session.
      </Text>
      <View style={[ui.panel, { padding: 20, marginBottom: 24, gap: 16 }]}>
        <View style={[ui.wrap, { alignItems: "flex-end" }]}>
          <View style={{ flex: 1, minWidth: 150 }}>
            <Field
              label="Prénom"
              placeholder="Ex. Camille"
              value={prenom}
              onChangeText={setPrenom}
              autoCorrect={false}
              returnKeyType="next"
              onSubmitEditing={() => nomRef.current?.focus()}
            />
          </View>
          <View style={{ flex: 1, minWidth: 150, gap: 8 }}>
            <Text
              style={{ fontSize: 13, fontWeight: "500", color: C.text.primary }}
            >
              Nom
            </Text>
            <TextInput
              ref={nomRef}
              accessibilityLabel="Nom"
              placeholder="Ex. Martin"
              placeholderTextColor={C.text.tertiary}
              value={nom}
              onChangeText={setNom}
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={add}
              style={{
                minHeight: 48,
                borderWidth: 1,
                borderColor: C.border,
                borderRadius: 6,
                padding: 12,
                fontSize: 16,
                color: C.text.primary,
                backgroundColor: C.surface,
              }}
            />
          </View>
          <Button
            label="Ajouter l’agenda"
            variant="primary"
            disabled={!prenom.trim() || !nom.trim()}
            onPress={add}
          />
        </View>
        {c.searchError && <Notice error>{c.searchError}</Notice>}
        {c.recentUsers.length > 0 && (
          <View style={{ gap: 12 }}>
            <Text style={ui.label}>Recherches récentes</Text>
            <View style={ui.wrap}>
              {c.recentUsers.map((u) => (
                <View
                  key={u.id}
                  style={[
                    ui.row,
                    {
                      gap: 0,
                      borderWidth: 1,
                      borderColor: C.border,
                      borderRadius: 6,
                    },
                  ]}
                >
                  <Button
                    label={`${u.prenom} ${u.nom}`}
                    variant="quiet"
                    onPress={() => void c.addUser(u.prenom, u.nom)}
                  />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Retirer ${u.prenom} ${u.nom} des recherches récentes`}
                    onPress={() => c.removeRecentUser(u.id)}
                    style={{
                      width: 44,
                      minHeight: 44,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ fontSize: 20, color: C.text.secondary }}>
                      ×
                    </Text>
                  </Pressable>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
      {c.users.length > 0 && (
        <View style={{ gap: 12, marginBottom: 24 }}>
          <Text style={ui.label}>Agendas affichés · légende</Text>
          <View style={ui.wrap}>
            {c.users.map((u) => (
              <View
                key={u.id}
                style={{
                  borderLeftWidth: 4,
                  borderLeftColor: u.color,
                  backgroundColor: C.surface,
                  paddingLeft: 12,
                  borderWidth: 1,
                  borderColor: C.border,
                  borderRadius: 4,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Text
                  style={{
                    color: C.text.primary,
                    fontWeight: "500",
                    fontSize: 13,
                    textTransform: "capitalize",
                  }}
                >
                  {u.prenom} {u.nom}
                </Text>
                <Button
                  label={`Retirer ${u.prenom}`}
                  variant="quiet"
                  onPress={() => c.removeUser(u.id)}
                />
              </View>
            ))}
          </View>
          {Object.entries(c.errors).map(([id, error]) => (
            <Notice key={id} error>
              {id} : {error} Les autres agendas restent affichés. Des horaires
              antérieurs peuvent rester visibles pour cet agenda.
            </Notice>
          ))}
        </View>
      )}
      {c.users.length ? (
        <>
          <CalendarToolbar calendar={c} allowWeekOnMobile />
          <AgendaGrid
            events={c.allEvents}
            startDay={c.viewMode === "week" ? c.currentDay : c.selectedDate}
            viewMode={c.viewMode}
            hideDetails
          />
        </>
      ) : (
        <Empty
          title="Aucun agenda ajouté"
          detail="Ajoutez un premier agenda pour repérer les horaires communs et les chevauchements."
        />
      )}
    </AppShell>
  );
}

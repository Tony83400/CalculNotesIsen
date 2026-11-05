import { MultiAgendaProvider } from "../hooks/useMultiAgenda";
import { AppearanceProvider } from "../providers/Appearance";
import { Colors as C } from "../constants/Colors";
import React from "react";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { AppDataProvider } from "../providers/AppData";
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppDataProvider>
        <MultiAgendaProvider>
          <AppearanceProvider>
            <StatusBar style="light" backgroundColor={C.brand.navy} />
            <Stack
              screenOptions={{
                headerShown: false,
                animation: "none",
                contentStyle: { backgroundColor: C.background },
              }}
            />
          </AppearanceProvider>
        </MultiAgendaProvider>
      </AppDataProvider>
    </SafeAreaProvider>
  );
}

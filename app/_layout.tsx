import React from "react";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { AppDataProvider } from "../providers/AppData";
import { MultiAgendaProvider } from "../hooks/useMultiAgenda";
import { Colors } from "../constants/Colors";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppDataProvider>
        <MultiAgendaProvider>
          <StatusBar style="dark" backgroundColor={Colors.background} />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: Colors.background },
            }}
          />
        </MultiAgendaProvider>
      </AppDataProvider>
    </SafeAreaProvider>
  );
}

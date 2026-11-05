import React, { createContext, useContext, useEffect, useState } from "react";
import { Appearance, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { setColorMode, Colors as C } from "../constants/Colors";
const Context = createContext({ dark: false, toggle: () => {} });
export const useAppearance = () => useContext(Context);
export function AppearanceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    let alive = true;
    void AsyncStorage.getItem("cnisen:appearance")
      .then((value) => {
        if (alive) {
          const d = value
            ? value === "dark"
            : Appearance.getColorScheme() === "dark";
          setColorMode(d ? "dark" : "light");
          setDark(d);
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  const toggle = () => {
    const next = !dark;
    setColorMode(next ? "dark" : "light");
    setDark(next);
    void AsyncStorage.setItem(
      "cnisen:appearance",
      next ? "dark" : "light",
    ).catch(() => {});
  };
  return (
    <Context.Provider value={{ dark, toggle }}>
      <View
        key={dark ? "dark" : "light"}
        style={{ flex: 1, backgroundColor: C.background }}
      >
        {children}
      </View>
    </Context.Provider>
  );
}

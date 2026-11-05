import { StyleSheet } from "react-native";
import { getColorMode } from "./Colors";
export function themedStyles<T extends StyleSheet.NamedStyles<T>>(
  factory: () => T,
): T {
  let mode = "",
    styles: T;
  return new Proxy({} as T, {
    get: (_, key) => {
      if (mode !== getColorMode()) {
        mode = getColorMode();
        styles = StyleSheet.create(factory());
      }
      return styles[key as keyof T];
    },
  });
}

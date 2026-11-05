import { it, expect, vi, afterEach } from "vitest";
import {
  Colors,
  LightColors,
  DarkColors,
  setColorMode,
} from "../constants/Colors";
import { themedStyles } from "../constants/themedStyles";
vi.mock("react-native", () => ({ StyleSheet: { create: (s: unknown) => s } }));
afterEach(() => setColorMode("light"));
it("updates cached styles and semantic colors when appearance changes without mutating the light palette", () => {
  const factory = vi.fn(() => ({
    panel: { backgroundColor: Colors.surface, color: Colors.text.primary },
  }));
  const styles = themedStyles(factory);
  setColorMode("light");
  expect(styles.panel.backgroundColor).toBe(LightColors.surface);
  void styles.panel;
  expect(factory).toHaveBeenCalledTimes(1);
  setColorMode("dark");
  expect(styles.panel.backgroundColor).toBe(DarkColors.surface);
  expect(styles.panel.color).toBe(DarkColors.text.primary);
  expect(factory).toHaveBeenCalledTimes(2);
  expect(LightColors.surface).toBe("#FFFFFF");
});

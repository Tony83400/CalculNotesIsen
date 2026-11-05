import { Platform } from "react-native";
export const Theme = {
  space: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 },
  radius: { control: 6, panel: 8, pill: 20 },
  border: 1,
  type: { body: 15, small: 13, label: 12, title: 28 },
  font: {
    heading: Platform.select({
      ios: "Georgia",
      android: "serif",
      default: "Georgia, serif",
    }),
    body: Platform.select({
      ios: "System",
      android: "sans-serif",
      default: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }),
  },
  controlHeight: 44,
};

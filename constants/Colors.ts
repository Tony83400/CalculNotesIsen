// Brand colors observed on https://educ.isen-mediterranee.fr/fr/.
// The coral is an identity accent; text actions use navy for accessible contrast.
const navy = "#26264C";
export const LightColors = {
  primary: navy,
  primaryLight: "#EEEEF5",
  background: "#F5F5F9",
  surface: "#FFFFFF",
  surfaceMuted: "#F0F0F6",
  surfaceSubtle: "#F8F8FC",
  brand: {
    navy,
    coral: "#EC4040",
    muted: "#D4D4E5",
    border: "#505074",
    panel: "#35355D",
  },
  text: {
    primary: navy,
    secondary: "#54566C",
    tertiary: "#656779",
    inverse: "#FFFFFF",
  },
  status: {
    success: "#21664E",
    warning: "#805316",
    error: "#AC2D35",
    info: "#365977",
    neutral: "#E9E9F0",
  },
  feedback: { errorBackground: "#FBEEF0", infoBackground: "#EDF1F7" },
  border: "#DADBE4",
  controlBorder: "#797C91",
  divider: "#E7E7EE",
  overlay: "#16162E80",
};

export const DarkColors: typeof LightColors = {
  ...LightColors,
  primary: "#D8D8FF",
  primaryLight: "#30304C",
  background: "#14141F",
  surface: "#202030",
  surfaceMuted: "#2B2B40",
  surfaceSubtle: "#191927",
  text: {
    primary: "#F2F2FA",
    secondary: "#C3C3D5",
    tertiary: "#AAAAC1",
    inverse: "#151525",
  },
  status: {
    success: "#80D7AF",
    warning: "#FFD06B",
    error: "#FF929A",
    info: "#9CCBFF",
    neutral: "#34344B",
  },
  feedback: { errorBackground: "#40232E", infoBackground: "#24354B" },
  border: "#45455D",
  controlBorder: "#85859F",
  divider: "#36364C",
  overlay: "#00000099",
};
let mode: "light" | "dark" = "light";
export function setColorMode(value: "light" | "dark") {
  mode = value;
}
export function getColorMode() {
  return mode;
}
export const Colors = new Proxy(LightColors, {
  get: (_, key: keyof typeof LightColors) =>
    (mode === "dark" ? DarkColors : LightColors)[key],
});

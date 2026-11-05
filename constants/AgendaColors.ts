// Stable pastel identities shared by the legend and calendar, in both themes.
const identities: Record<string, { background: string; border: string }> = {
  "#26264C": { background: "#C6E3FF", border: "#5299DC" },
  "#B2343D": { background: "#FFD4DE", border: "#E77998" },
  "#2D627A": { background: "#BCEEE9", border: "#45AEA2" },
  "#6A5730": { background: "#FFE6AD", border: "#C99734" },
  "#49664A": { background: "#D3EBC0", border: "#83AC5B" },
  "#765680": { background: "#E4D4FF", border: "#A184D0" },
};
export function agendaColors(color: string) {
  return {
    ...(identities[color.toUpperCase()] || identities["#26264C"]),
    text: "#202438",
  };
}

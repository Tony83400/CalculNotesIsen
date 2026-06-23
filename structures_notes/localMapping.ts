// Ce fichier sert de fallback pour le développement local et le bundling Web
const localMapping: Record<string, any> = {
    "structure.json": require("./structure.json"),
    "annee_3/S5_BIOST.json": require("./annee_3/S5_BIOST.json"),
    "annee_3/S5_CIN_UI.json": require("./annee_3/S5_CIN_UI.json"),
    "annee_3/S5_CPGE_UE.json": require("./annee_3/S5_CPGE_UE.json"),
    "annee_3/S6_BIOST_CPGE_UE.json": require("./annee_3/S6_BIOST_CPGE_UE.json"),
    "annee_3/S6_CIN_UI.json": require("./annee_3/S6_CIN_UI.json"),
    "annee_1/S1_CIN.Json": require("./annee_1/S1_CIN.Json"),
    "annee_1/S2_CIN.json": require("./annee_1/S2_CIN.json")
};

export default localMapping;

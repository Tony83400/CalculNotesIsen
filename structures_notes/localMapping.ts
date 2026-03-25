// Ce fichier sert de fallback pour le développement local avant que les fichiers ne soient sur GitHub
const localMapping: Record<string, any> = {
    "annee_3/S6_BIOST_CPGE_UE.json": require("./annee_3/S6_BIOST_CPGE_UE.json"),
    "annee_3/S6_CIN_UI.json": require("./annee_3/S6_CIN_UI.json"),
    "annee_3/S5_CPGE_UE.json": require("./annee_3/S5_CPGE_UE.json"),
    "annee_3/S5_BIOST.json": require("./annee_3/S5_BIOST.json"),
    "annee_3/S5_CIN_UI.json": require("./annee_3/S5_CIN_UI.json"),
};

export default localMapping;

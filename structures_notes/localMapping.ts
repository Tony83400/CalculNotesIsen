// Ce fichier sert de fallback pour le développement local et le bundling Web
const localMapping: Record<string, any> = {
    "structure.json": require("./structure.json"),
    "annee_3/S5_BIOST.json": require("./annee_3/S5_BIOST.json"),
    "annee_3/S5_CIN_UI.json": require("./annee_3/S5_CIN_UI.json"),
    "annee_3/S5_CPGE_UE.json": require("./annee_3/S5_CPGE_UE.json"),
    "annee_3/S6_BIOST_CPGE_UE.json": require("./annee_3/S6_BIOST_CPGE_UE.json"),
    "annee_3/S6_CIN_UI.json": require("./annee_3/S6_CIN_UI.json"),
    "annee_1/S1_CIN.json": require("./annee_1/S1_CIN.json"),
    "annee_1/S2_CIN.json": require("./annee_1/S2_CIN.json"),
    "annee_4/S7_DEV_LOGICIEL.json": require("./annee_4/S7_DEV_LOGICIEL.json"),
    "annee_4/S8_DEV_LOGICIEL.json": require("./annee_4/S8_DEV_LOGICIEL.json"),
    "annee_4/S7_CYBER.json": require("./annee_4/S7_CYBER.json"),
    "annee_4/S8_CYBER.json": require("./annee_4/S8_CYBER.json"),
    "annee_4/S7_EMBEDDED.json": require("./annee_4/S7_EMBEDDED.json"),
    "annee_4/S8_EMBEDDED.json": require("./annee_4/S8_EMBEDDED.json"),
    "annee_4/S7_ROBOTIQUE.json": require("./annee_4/S7_ROBOTIQUE.json"),
    "annee_4/S8_ROBOTIQUE.json": require("./annee_4/S8_ROBOTIQUE.json"),
    "annee_4/S7_IOT.json": require("./annee_4/S7_IOT.json"),
    "annee_4/S8_IOT.json": require("./annee_4/S8_IOT.json"),
    "annee_4/S7_E_SANTE.json": require("./annee_4/S7_E_SANTE.json"),
    "annee_4/S8_E_SANTE.json": require("./annee_4/S8_E_SANTE.json"),
    "annee_4/S7_SMART.json": require("./annee_4/S7_SMART.json"),
    "annee_4/S8_SMART.json": require("./annee_4/S8_SMART.json")
};

export default localMapping;



import { useState } from "react";
import { router } from "expo-router";
import { useAppData } from "../providers/AppData";
import { setId } from "../services/storage";

export function useAuth() {
  const app = useAppData();
  const [email, setEmail] = useState(app.user || "");
  const [password, setPassword] = useState("");
  const [errorText, setErrorText] = useState("");
  const [keepLogin, setKeepLogin] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (id: string, pass: string) => {
    if (loading || !app.ready) return;
    if (!id.trim() || !pass) {
      setErrorText("Veuillez remplir tous les champs");
      return;
    }
    setLoading(true);
    setErrorText("");
    try {
      await app.authenticate(id, pass, keepLogin);
      setPassword("");
      if (app.year && Object.keys(app.majors).length > 0) {
        router.replace("/selection");
      } else {
        router.replace("/selectionAnnee");
      }
    } catch (e) {
      setErrorText(
        (e as Error).name === "AbortError"
          ? "La connexion a pris trop de temps. Réessayez."
          : (e as Error).message || "Identifiant ou mot de passe incorrect.",
      );
    } finally {
      setLoading(false);
    }
  };

  const loginWithoutAccount = async () => {
    await setId("");
    router.replace("/selectionAnnee");
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    errorText,
    setErrorText,
    keepLogin,
    setKeepLogin,
    loading,
    handleLogin,
    loginWithoutAccount,
  };
}

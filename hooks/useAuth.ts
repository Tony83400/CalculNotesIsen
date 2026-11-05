import { useState } from "react";
import { router } from "expo-router";
import { useAppData } from "../providers/AppData";
export function useAuth() {
  const app = useAppData();
  const [email, setEmail] = useState(
      app.user && app.user !== "demo" ? app.user : "",
    ),
    [password, setPassword] = useState(""),
    [errorText, setErrorText] = useState(""),
    [keepLogin, setKeepLogin] = useState(false),
    [loading, setLoading] = useState(false);
  const handleLogin = async (id: string, pass: string) => {
    if (loading) return;
    if (!id.trim() || !pass) {
      setErrorText("Renseignez votre identifiant et votre mot de passe.");
      return;
    }
    setLoading(true);
    setErrorText("");
    try {
      await app.authenticate(id, pass, keepLogin);
      setPassword("");
      router.replace("/selection");
    } catch (e) {
      setErrorText(
        (e as Error).name === "AbortError"
          ? "La connexion a pris trop de temps. Réessayez."
          : (e as Error).message,
      );
    } finally {
      setLoading(false);
    }
  };
  const loginWithoutAccount = async () => {
    await app.startDemo();
    router.replace("/selection");
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

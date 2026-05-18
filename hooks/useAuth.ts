import { useState, useEffect } from "react";
import { router } from "expo-router";
import { 
    getId, 
    getPasswordStorage, 
    setId, 
    setPasswordStorage, 
    setToken, 
    getSelectedYear, 
    getSelectedMajors, 
    getToken, 
    isTokenExpired 
} from "@/services/storage";
import { login as apiLogin } from "@/services/isenApi";

export const useAuth = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errorText, setErrorText] = useState("");
    const [keepLogin, setKeepLogin] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchUser = async () => {
            const year = await getSelectedYear();
            const majors = await getSelectedMajors();
            const Fetchpassword = await getPasswordStorage();
            const Fetchemail = await getId();
            const token = await getToken();
            const expired = await isTokenExpired();

            if (Fetchpassword) {
                setKeepLogin(true);
            }

            if (token && !expired && year && majors) {
                router.replace("/selection");
                return;
            }

            if (Fetchemail) setEmail(Fetchemail);
            if (Fetchemail && Fetchpassword) {
                setPassword(Fetchpassword);
                handleLogin(Fetchemail, Fetchpassword);
            }
        };
        fetchUser();
    }, []);

    const handleLogin = async (emailLogin: string, passwordLogin: string) => {
        if (!emailLogin || !passwordLogin) {
            setErrorText("Veuillez remplir tous les champs");
            return;
        }

        setLoading(true);
        setErrorText("");
        
        try {
            const rep = await apiLogin({
                username: emailLogin,
                password: passwordLogin
            });
            await setToken(rep.token);
            await setId(emailLogin);
            if (keepLogin) {
                await setPasswordStorage(passwordLogin);
            } else {
                await setPasswordStorage(""); // Clear if not keeping login
            }

            const year = await getSelectedYear();
            const majors = await getSelectedMajors();
            if (year && majors) {
                router.replace("/selection");
            } else {
                router.replace("/selectionAnnee");
            }
        } catch (error) {
            setErrorText((error as Error).message);
        } finally {
            setLoading(false);
        }
    };

    const loginWithoutAccount = async () => {
        await setId("");
        router.push("/notes");
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
        loginWithoutAccount
    };
};

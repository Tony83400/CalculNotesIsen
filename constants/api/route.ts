import { API_URL } from "@/constants/api_route";

export async function login(loginData: {
    username: string,
    password: string
}) {
    try {
        const res = await fetch(`${API_URL}/token`, {
            method: "POST",
            headers: {
                Accept: "*/*",
                "Content-Type": "application/json",
            },
            body: JSON.stringify(loginData),
        });

        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(errorText || "Erreur serveur");
        }

        const token = await res.text();

        console.log("Token reçu:", token);
        return { token: token };

    } catch (error) {
        console.error("Erreur dans Login :", error);
        throw error;
    }
}
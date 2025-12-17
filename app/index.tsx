import { useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { login } from "../constants/api/route";

export default function Index() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const onPressLogin = async () => {
        const rep = await login({
            username: email,
            password: password
        })
    }
    return (
        <View
            style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
            }}
        >
            <TextInput
                placeholder="nom.prenom"
                value={email}
                onChangeText={setEmail}
            />
            <TextInput
                placeholder="mot de passe"
                value={password}
                onChangeText={setPassword}
            />
            <TouchableOpacity onPress={onPressLogin}><Text>Se connecter</Text></TouchableOpacity>

        </View>
    );
}

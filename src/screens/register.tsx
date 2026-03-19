import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { ref, set } from "firebase/database";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import type { RootStackParamList } from "../../app/(tabs)/index";
import { auth, database } from "../services/connectionFirebase";

type RegisterNavigationProp = StackNavigationProp<
  RootStackParamList,
  "RegisterScreens"
>;

export default function RegisterScreens() {
  const navigation = useNavigation<RegisterNavigationProp>();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState("");

  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "");

    if (numbers.length <= 2) return `(${numbers}`;
    if (numbers.length <= 7) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    }

    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(
      7,
      11
    )}`;
  };

  const validate = () => {
    let hasError = false;

    setNameError("");
    setEmailError("");
    setPhoneError("");
    setPasswordError("");

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.replace(/\D/g, "");

    if (!cleanName) {
      setNameError("Nome e obrigatorio");
      hasError = true;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      setEmailError("Email invalido");
      hasError = true;
    }

    if (!/^\d{10,11}$/.test(cleanPhone)) {
      setPhoneError("Telefone invalido");
      hasError = true;
    }

    if (password.length < 6) {
      setPasswordError("Senha deve ter pelo menos 6 caracteres");
      hasError = true;
    }

    return !hasError;
  };

  async function register(): Promise<void> {
    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.trim().toLowerCase(),
        password
      );

      const user = userCredential.user;

      if (user) {
        await set(ref(database, `users/${user.uid}`), {
          uid: user.uid,
          name: name.trim(),
          phone: phone.replace(/\D/g, ""),
          email: email.trim().toLowerCase(),
          createdAt: new Date().toISOString(),
        });
      }

      if (Platform.OS === "web") {
        alert("Usuario cadastrado com sucesso!");
      } else {
        Alert.alert("Sucesso", "Usuario cadastrado com sucesso!");
      }

      setMensagem("Usuario cadastrado com sucesso!");
      setName("");
      setPhone("");
      setEmail("");
      setPassword("");
      navigation.navigate("LoginScreens");
    } catch (error: any) {
      if (Platform.OS === "web") {
        alert(error.message);
      } else {
        Alert.alert("Erro", error.message);
      }

      setMensagem("Erro ao cadastrar usuario");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate("HomeScreens")}>
          <Text style={styles.headerTitle}>Tech Store</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Criar Conta</Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Nome Completo"
            placeholderTextColor="#888"
            value={name}
            onChangeText={setName}
          />
          {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#888"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {emailError ? (
            <Text style={styles.errorText}>{emailError}</Text>
          ) : null}

          <TextInput
            style={styles.input}
            placeholder="(00)00000-0000"
            placeholderTextColor="#888"
            value={phone}
            onChangeText={(text) => setPhone(formatPhone(text))}
            keyboardType="phone-pad"
          />
          {phoneError ? (
            <Text style={styles.errorText}>{phoneError}</Text>
          ) : null}

          <TextInput
            style={styles.input}
            placeholder="Senha"
            placeholderTextColor="#888"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          {passwordError ? (
            <Text style={styles.errorText}>{passwordError}</Text>
          ) : null}

          <TouchableOpacity
            style={styles.button}
            onPress={register}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? "Cadastrando..." : "Cadastrar"}
            </Text>
          </TouchableOpacity>

          {mensagem ? (
            <Text style={styles.messageText}>{mensagem}</Text>
          ) : null}

          <TouchableOpacity onPress={() => navigation.navigate("LoginScreens")}>
            <Text style={styles.loginText}>Ja possui conta? Fazer login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 80,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1E1E1E",
    paddingHorizontal: 20,
    marginBottom: 20,
  },

  headerTitle: {
    color: "#FFF",
    fontSize: 22,
    fontWeight: "bold",
  },

  screen: {
    flex: 1,
    backgroundColor: "#030d13",
  },

  content: {
    flex: 1,
    justifyContent: "center",
    padding: 30,
  },

  title: {
    fontSize: 28,
    color: "#FFF",
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 30,
  },

  form: {
    gap: 15,
  },

  input: {
    backgroundColor: "#1E1E1E",
    padding: 15,
    borderRadius: 10,
    color: "#FFF",
    fontSize: 16,
  },

  button: {
    backgroundColor: "#FFF",
    padding: 15,
    borderRadius: 25,
    alignItems: "center",
    marginTop: 10,
  },

  buttonText: {
    fontWeight: "bold",
    fontSize: 16,
  },

  loginText: {
    color: "#FFF",
    textAlign: "center",
    marginTop: 15,
  },

  errorText: {
    color: "#FF6B6B",
    fontSize: 14,
    marginTop: 5,
    marginLeft: 5,
  },

  messageText: {
    color: "#FFF",
    textAlign: "center",
    marginTop: 10,
  },
});

import { useRouter } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { get, ref } from "firebase/database";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import AppHeader from "../components/AppHeader";
import { auth, database } from "../services/connectionFirebase";

const LoginScreens = () => {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [emailError, setEmailError] = useState<string>("");
  const [passwordError, setPasswordError] = useState("");
  const contentWidth = Math.min(width - 32, 420);

  const handleLogin = async () => {
    setEmailError("");
    setPasswordError("");

    if (!email) {
      setEmailError("Email é obrigatório");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError("Email inválido");
      return;
    }

    if (!password) {
      setPasswordError("Senha é obrigatória");
      return;
    }

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const userCredential = await signInWithEmailAndPassword(
        auth,
        normalizedEmail,
        password
      );
      const snapshot = await get(
        ref(database, `users/${userCredential.user.uid}`)
      );
      const userData = snapshot.val();

      if (userData) {
        router.replace("/(tabs)");
      } else {
        Alert.alert("Erro", "Perfil do usuário não encontrado.");
      }
    } catch (error: any) {
      if (error.code === "auth/invalid-credential") {
        setPasswordError("Email ou senha incorretos");
        return;
      }

      if (error.code === "auth/user-not-found") {
        setEmailError("Conta não cadastrada");
        return;
      }

      Alert.alert("Erro", "Falha ao fazer login.");
    }
  };

  return (
    <View style={styles.screen}>
      <AppHeader />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.container, { width: "100%", maxWidth: contentWidth }]}>
            <Text style={styles.title}>Login</Text>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#888"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
            {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
            <TextInput
              style={styles.input}
              placeholder="Senha"
              placeholderTextColor="#888"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            {passwordError ? (
              <Text style={styles.errorText}>{passwordError}</Text>
            ) : null}
            <TouchableOpacity style={styles.button} onPress={handleLogin}>
              <Text style={styles.buttonText}>Entrar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push("/register")}>
              <Text style={styles.link}>Nao tem conta? Cadastre-se</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  screen: {
    flex: 1,
    backgroundColor: "#030d13",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 24,
  },

  container: {
    justifyContent: "center",
    alignSelf: "center",
    padding: 24,
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 32,
    color: "#FFF",
  },

  input: {
    width: "100%",
    minHeight: 48,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: "#1E1E1E",
    color: "#FFF",
  },

  button: {
    width: "100%",
    minHeight: 48,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },

  buttonText: {
    color: "#121212",
    fontSize: 18,
    fontWeight: "bold",
  },

  link: {
    color: "#FFF",
    textAlign: "center",
    marginTop: 20,
    textDecorationLine: "underline",
  },

  errorText: {
    color: "#FF6B6B",
    fontSize: 14,
    marginTop: -8,
    marginBottom: 8,
    width: "100%",
  },
});

export default LoginScreens;

import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { signInWithEmailAndPassword } from "firebase/auth";
import { get, ref } from "firebase/database";
import React, { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import type { RootStackParamList } from "../../app/(tabs)/index";
import { auth, database } from "../services/connectionFirebase";

type LoginNavigationProp = StackNavigationProp<
  RootStackParamList,
  "LoginScreens"
>;

const LoginScreens = () => {
  const navigation = useNavigation<LoginNavigationProp>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const handleLogin = async () => {
    setEmailError("");
    setPasswordError("");

    if (!email) {
      setEmailError("Email e obrigatorio");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError("Email invalido");
      return;
    }

    if (!password) {
      setPasswordError("Senha e obrigatoria");
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
        navigation.navigate("HomeScreens");
      } else {
        Alert.alert("Erro", "Perfil do usuario nao encontrado.");
      }
    } catch (error: any) {
      if (error.code === "auth/invalid-credential") {
        setPasswordError("Email ou senha incorretos");
        return;
      }

      if (error.code === "auth/user-not-found") {
        setEmailError("Conta nao cadastrada");
        return;
      }

      Alert.alert("Erro", "Falha ao fazer login.");
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate("HomeScreens")}>
          <Text style={styles.headerTitle}>Tech Store</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.container}>
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
        <TouchableOpacity onPress={() => navigation.navigate("RegisterScreens")}>
          <Text style={styles.link}>Nao tem conta? Cadastre-se</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#030d13",
  },

  header: {
    height: 80,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1E1E1E",
    paddingHorizontal: 20,
  },

  headerTitle: {
    color: "#FFF",
    fontSize: 22,
    fontWeight: "bold",
  },

  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
    height: 48,
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
    height: 48,
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
    marginTop: 5,
    marginLeft: 5,
  },
});

export default LoginScreens;

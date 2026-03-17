import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import React, { useState } from "react";
import {
  Alert,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { createUserWithEmailAndPassword } from "firebase/auth";
import{set,ref} from "firebase/database";
import{auth, database} from "../services/connectionFirebase";

type RootStackParamList = {
  HomeScreens: { justRegistered?: boolean };
  RegisterScreens: undefined;
  LoginScreens: undefined;
  PerfilScreens: { user: { name: string; email: string; phone: string } };
};

type RegisterNavigationProp =
  StackNavigationProp<RootStackParamList, "RegisterScreens">;
  


  const navigation = useNavigation<RegisterNavigationProp>();


  const formatPhone = (value: string) => {
  const numbers = value.replace(/\D/g, "");

  if (numbers.length <= 2)
    return `(${numbers}`;
  if (numbers.length <= 7)
    return `(${numbers.slice(0,2)}) ${numbers.slice(2)}`;
  if (numbers.length <= 11)
    return `(${numbers.slice(0,2)}) ${numbers.slice(2,7)}-${numbers.slice(7)}`;

  return `(${numbers.slice(0,2)}) ${numbers.slice(2,7)}-${numbers.slice(7,11)}`;
};

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  
    if (loading) return;
    setLoading(true);

    Keyboard.dismiss();

    // Clear previous errors
    setNameError("");
    setEmailError("");
    setPhoneError("");
    setPasswordError("");

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.replace(/\D/g, "");

    let hasError = false;

    if (!cleanName) {
      setNameError("Nome é obrigatório");
      hasError = true;
    }

    if (!cleanEmail) {
      setEmailError("Email é obrigatório");
      hasError = true;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        setEmailError("Email inválido");
        hasError = true;
      }
    }

    if (!cleanPhone) {
      setPhoneError("Telefone é obrigatório");
      hasError = true;
    } else {
      if (!/^\d{10,11}$/.test(cleanPhone)) {
        setPhoneError("Telefone inválido (10 ou 11 dígitos)");
        hasError = true;
      }
    }

    if (!password) {
      setPasswordError("Senha é obrigatória");
      hasError = true;
    } else {
      if (password.length < 6) {
        setPasswordError("Senha deve ter pelo menos 6 caracteres");
        hasError = true;
      }
    }

    if (hasError) {
      setLoading(false);
      return;
    }

    const user = {
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      password
    };

      register();
      router.replace("/login")
      function register(){
      try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      if (user) {
        await set(ref(database, "users/" + user.uid), {
          uid: user.uid,
          name: name,
          email: email,
          createdAt: new Date().toISOString(),
        });
        };  
      }
    }
  


  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate("HomeScreens" as any)}>
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
          autoCapitalize="words"
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
        {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

        <TextInput
        style={styles.input}
        placeholder="(00)00000-0000"
        placeholderTextColor="#888"
        value={phone}
        onChangeText={(text) => setPhone(formatPhone(text))}
        keyboardType="phone-pad"
        />
        {phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null}

        <TextInput
          style={styles.input}
          placeholder="Senha"
          placeholderTextColor="#888"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

        <TouchableOpacity
          style={styles.button}
          onPress={handleRegister}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Cadastrando..." : "Cadastrar"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate("LoginScreens")}
        >
          <Text style={styles.loginText}>
            Já possui conta? Fazer login
          </Text>
        </TouchableOpacity>

      </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({

  /* HEADER */
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
    marginBottom: 30
  },

  form: {
    gap: 15
  },

  input: {
    backgroundColor: "#1E1E1E",
    padding: 15,
    borderRadius: 10,
    color: "#FFF",
    fontSize: 16
  },

  button: {
    backgroundColor: "#FFF",
    padding: 15,
    borderRadius: 25,
    alignItems: "center",
    marginTop: 10
  },

  buttonText: {
    fontWeight: "bold",
    fontSize: 16
  },

  loginText: {
    color: "#FFF",
    textAlign: "center",
    marginTop: 15
  },

  errorText: {
    color: "#FF6B6B",
    fontSize: 14,
    marginTop: 5,
    marginLeft: 5
  }

});
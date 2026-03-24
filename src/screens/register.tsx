import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { ref, set } from "firebase/database";
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
import MaskInput from "react-native-mask-input";
import AppHeader from "../components/AppHeader";

import { auth, database } from "../services/connectionFirebase";

const PHONE_MASK = [
  "(",
  /\d/,
  /\d/,
  ")",
  " ",
  /\d/,
  /\d/,
  /\d/,
  /\d/,
  /\d/,
  "-",
  /\d/,
  /\d/,
  /\d/,
  /\d/,
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{6,}$/;

function getPasswordStrength(password: string) {
  let strength = 0;

  if (password.length >= 6) strength += 1;
  if (/[A-Z]/.test(password)) strength += 1;
  if (/\d/.test(password)) strength += 1;
  if (/[@$!%*?&]/.test(password)) strength += 1;

  if (strength <= 2) return { label: "Fraca", color: "#FF6B6B" };
  if (strength === 3) return { label: "Média", color: "#FFD166" };

  return { label: "Forte", color: "#06D6A0" };
}

function PasswordRule({ valid, text }: { valid: boolean; text: string }) {
  return (
    <Text style={[styles.passwordRuleText, valid && styles.passwordRuleValid]}>
      • {text}
    </Text>
  );
}

function FieldRule({ valid, text }: { valid: boolean; text: string }) {
  return (
    <Text style={[styles.fieldRuleText, valid && styles.fieldRuleValid]}>
      • {text}
    </Text>
  );
}

export default function RegisterScreens() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width - 32, 520);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");

  const cleanName = name.trim();
  const cleanEmail = email.trim().toLowerCase();
  const cleanPhone = phone.replace(/\D/g, "");
  const passwordStrength = getPasswordStrength(password);
  const hasFullName = cleanName.split(/\s+/).filter(Boolean).length >= 2;
  const isValidEmail = EMAIL_REGEX.test(cleanEmail);
  const isValidPhone = /^\d{10,11}$/.test(cleanPhone);
  const isConfirmPasswordValid =
    password.length > 0 &&
    confirmPassword.length > 0 &&
    password === confirmPassword;

  const passwordRules = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
    symbol: /[@$!%*?&]/.test(password),
  };

  const isFormValid =
    hasFullName &&
    isValidEmail &&
    isValidPhone &&
    PASSWORD_REGEX.test(password) &&
    isConfirmPasswordValid;

  const resetErrors = () => {
    setNameError("");
    setEmailError("");
    setPhoneError("");
    setPasswordError("");
    setConfirmPasswordError("");
  };

  const validate = () => {
    let hasError = false;

    resetErrors();

    if (!hasFullName) {
      setNameError("Digite nome e sobrenome");
      hasError = true;
    }

    if (!isValidEmail) {
      setEmailError("Email inválido");
      hasError = true;
    }

    if (!isValidPhone) {
      setPhoneError("Telefone inválido");
      hasError = true;
    }

    if (!PASSWORD_REGEX.test(password)) {
      setPasswordError(
        "Senha deve ter no mínimo 8 caracteres, 1 letra maiúscula, 1 número e 1 símbolo"
      );
      hasError = true;
    }

    if (!isConfirmPasswordValid) {
      setConfirmPasswordError("As senhas não coincidem");
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
        cleanEmail,
        password
      );

      const user = userCredential.user;

      await set(ref(database, `users/${user.uid}`), {
        uid: user.uid,
        name: cleanName,
        phone: cleanPhone,
        email: cleanEmail,
        createdAt: new Date().toISOString(),
      });

      if (Platform.OS === "web") {
        alert("Usuário cadastrado com sucesso!");
      } else {
        Alert.alert("Sucesso", "Usuário cadastrado com sucesso!");
      }

      setMessage("Usuário cadastrado com sucesso!");
      setName("");
      setEmail("");
      setPhone("");
      setPassword("");
      setConfirmPassword("");
      resetErrors();
      router.replace("/(tabs)");
    } catch (error: any) {
      const errorMessage = error?.message ?? "Erro ao cadastrar usuário";

      if (Platform.OS === "web") {
        alert(errorMessage);
      } else {
        Alert.alert("Erro", errorMessage);
      }

      setMessage("Erro ao cadastrar usuário");
    } finally {
      setLoading(false);
    }
  }

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
          <View style={[styles.content, { width: "100%", maxWidth: contentWidth }]}>
            <Text style={styles.title}>Criar Conta</Text>

            <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Nome Completo"
            placeholderTextColor="#888"
            value={name}
            onChangeText={setName}
          />
          {name.length > 0 ? (
            <FieldRule valid={hasFullName} text="Digite nome e sobrenome" />
          ) : null}
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
          {email.length > 0 ? (
            <FieldRule valid={isValidEmail} text="Digite um email válido" />
          ) : null}
          {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

          <MaskInput
            style={styles.input}
            placeholder="(00) 00000-0000"
            placeholderTextColor="#888"
            value={phone}
            onChangeText={(masked) => setPhone(masked)}
            mask={PHONE_MASK}
            keyboardType="phone-pad"
          />
          {phone.length > 0 ? (
            <FieldRule
              valid={isValidPhone}
              text="Digite um telefone com DDD e 10 ou 11 números"
            />
          ) : null}
          {phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null}

          <View>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Senha"
                placeholderTextColor="#888"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />

              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword((current) => !current)}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={22}
                  color="#FFF"
                />
              </TouchableOpacity>
            </View>

            {password.length > 0 ? (
              <>
                <Text
                  style={[
                    styles.passwordStrengthText,
                    { color: passwordStrength.color },
                  ]}
                >
                  Força da senha: {passwordStrength.label}
                </Text>

                <View style={styles.passwordRulesContainer}>
                  <Text style={styles.passwordRulesTitle}>
                    A senha deve conter:
                  </Text>
                  <PasswordRule
                    valid={passwordRules.length}
                    text="Pelo menos 8 caracteres"
                  />
                  <PasswordRule
                    valid={passwordRules.uppercase}
                    text="Uma letra maiúscula"
                  />
                  <PasswordRule
                    valid={passwordRules.number}
                    text="Um número"
                  />
                  <PasswordRule
                    valid={passwordRules.symbol}
                    text="Um símbolo (@$!%*?&)"
                  />
                </View>
              </>
            ) : null}

            {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
          </View>

          <View>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Confirmar Senha"
                placeholderTextColor="#888"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
              />

              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowConfirmPassword((current) => !current)}
              >
                <Ionicons
                  name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                  size={22}
                  color="#FFF"
                />
              </TouchableOpacity>
            </View>

            {confirmPasswordError ? (
              <Text style={styles.errorText}>{confirmPasswordError}</Text>
            ) : null}

            {confirmPassword.length > 0 ? (
              <FieldRule
                valid={password.length > 6}
                text="A confirmação deve ser igual à senha"
              />
            ) : null}
          </View>

          <TouchableOpacity
            style={[styles.button, !isFormValid && styles.buttonDisabled]}
            onPress={register}
            disabled={!isFormValid || loading}
          >
            <Text style={styles.buttonText}>
              {loading ? "Cadastrando..." : "Cadastrar"}
            </Text>
          </TouchableOpacity>

          {message ? <Text style={styles.messageText}>{message}</Text> : null}

          <TouchableOpacity onPress={() => router.replace("/(tabs)/user")}>
            <Text style={styles.loginText}>Já possui conta? Fazer login</Text>
          </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  screen: {
    flex: 1,
    backgroundColor: "#030D13",
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  content: {
    justifyContent: "center",
    alignSelf: "center",
    paddingVertical: 24,
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
    minHeight: 52,
    borderRadius: 10,
    color: "#FFF",
    fontSize: 16,
  },
  passwordContainer: {
    position: "relative",
    justifyContent: "center",
  },
  passwordInput: {
    backgroundColor: "#1E1E1E",
    paddingVertical: 15,
    paddingLeft: 15,
    paddingRight: 52,
    minHeight: 52,
    borderRadius: 10,
    color: "#FFF",
    fontSize: 16,
  },
  eyeIcon: {
    position: "absolute",
    right: 15,
  },
  passwordStrengthText: {
    marginTop: 8,
    marginLeft: 5,
    fontSize: 14,
  },
  passwordRulesContainer: {
    marginTop: 5,
    gap: 4,
  },
  passwordRulesTitle: {
    color: "#FFF",
    fontSize: 13,
    marginLeft: 5,
  },
  passwordRuleText: {
    color: "#888",
    fontSize: 13,
    marginLeft: 5,
  },
  passwordRuleValid: {
    color: "#06D6A0",
  },
  fieldRuleText: {
    color: "#888",
    fontSize: 13,
    marginTop: 5,
    marginLeft: 5,
  },
  fieldRuleValid: {
    color: "#06D6A0",
  },
  button: {
    backgroundColor: "#FFF",
    padding: 15,
    minHeight: 52,
    borderRadius: 25,
    alignItems: "center",
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.5,
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
    marginTop: -8,
    width: "100%",
  },
  messageText: {
    color: "#FFF",
    textAlign: "center",
    marginTop: 10,
  },
});

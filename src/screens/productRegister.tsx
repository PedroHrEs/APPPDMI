import { useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { push, ref, set } from "firebase/database";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
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

export default function ProductRegisterScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width - 32, 560);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [nameError, setNameError] = useState("");
  const [descriptionError, setDescriptionError] = useState("");
  const [priceError, setPriceError] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
      setLoadingAuth(false);
    });

    return unsubscribe;
  }, []);

  const cleanName = name.trim();
  const cleanDescription = description.trim();
  const normalizedPrice = price.replace(",", ".").trim();
  const parsedPrice = Number(normalizedPrice);
  const isPriceValid = normalizedPrice.length > 0 && !Number.isNaN(parsedPrice) && parsedPrice > 0;
  const isFormValid =
    cleanName.length >= 3 && cleanDescription.length >= 10 && isPriceValid;

  const resetErrors = () => {
    setNameError("");
    setDescriptionError("");
    setPriceError("");
  };

  const validate = () => {
    let hasError = false;
    resetErrors();

    if (cleanName.length < 3) {
      setNameError("Informe um nome com pelo menos 3 caracteres");
      hasError = true;
    }

    if (cleanDescription.length < 10) {
      setDescriptionError("Informe uma descricao com pelo menos 10 caracteres");
      hasError = true;
    }

    if (!isPriceValid) {
      setPriceError("Informe um valor valido maior que zero");
      hasError = true;
    }

    return !hasError;
  };

  const handleCreateProduct = async () => {
    if (!isLoggedIn || !auth.currentUser) {
      Alert.alert("Login necessario", "Entre na sua conta para cadastrar produtos.");
      router.replace("/(tabs)/user");
      return;
    }

    if (!validate()) {
      return;
    }

    setSubmitting(true);

    try {
      const productsRef = ref(database, "products");
      const newProductRef = push(productsRef);
      const productId = newProductRef.key;

      if (!productId) {
        throw new Error("product-id-not-generated");
      }

      await set(newProductRef, {
        id: productId,
        name: cleanName,
        description: cleanDescription,
        price: parsedPrice,
        userId: auth.currentUser.uid,
        userEmail: auth.currentUser.email ?? "",
        createdAt: new Date().toISOString(),
      });

      Alert.alert("Sucesso", "Produto cadastrado com sucesso.");
      setName("");
      setDescription("");
      setPrice("");
      resetErrors();
    } catch {
      Alert.alert("Erro", "Nao foi possivel cadastrar o produto.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingAuth) {
    return (
      <View style={styles.screen}>
        <AppHeader />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFF" />
        </View>
      </View>
    );
  }

  if (!isLoggedIn) {
    return (
      <View style={styles.screen}>
        <AppHeader />
        <View style={styles.centeredContent}>
          <Text style={styles.title}>Criar Produto</Text>
          <Text style={styles.infoText}>
            Voce precisa estar logado para cadastrar um produto.
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.replace("/(tabs)/user")}
          >
            <Text style={styles.primaryButtonText}>Ir para login</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
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
          <View style={[styles.container, { width: "100%", maxWidth: contentWidth }]}>
            <Text style={styles.title}>Criar Produto</Text>

            <TextInput
              style={styles.input}
              placeholder="Nome do produto"
              placeholderTextColor="#888"
              value={name}
              onChangeText={setName}
            />
            {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Descricao do produto"
              placeholderTextColor="#888"
              value={description}
              onChangeText={setDescription}
              multiline
              textAlignVertical="top"
            />
            {descriptionError ? (
              <Text style={styles.errorText}>{descriptionError}</Text>
            ) : null}

            <TextInput
              style={styles.input}
              placeholder="Valor do produto"
              placeholderTextColor="#888"
              value={price}
              onChangeText={setPrice}
              keyboardType="decimal-pad"
            />
            {priceError ? <Text style={styles.errorText}>{priceError}</Text> : null}

            <TouchableOpacity
              style={[styles.primaryButton, !isFormValid && styles.buttonDisabled]}
              onPress={handleCreateProduct}
              disabled={!isFormValid || submitting}
            >
              <Text style={styles.primaryButtonText}>
                {submitting ? "Salvando..." : "Cadastrar produto"}
              </Text>
            </TouchableOpacity>
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
    backgroundColor: "#030d13",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  centeredContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    gap: 16,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  container: {
    alignSelf: "center",
    gap: 14,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFF",
    textAlign: "center",
    marginBottom: 10,
  },
  infoText: {
    color: "#DDD",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
  input: {
    backgroundColor: "#1E1E1E",
    minHeight: 52,
    borderRadius: 10,
    paddingHorizontal: 16,
    color: "#FFF",
    fontSize: 16,
  },
  textArea: {
    minHeight: 140,
    paddingTop: 16,
  },
  primaryButton: {
    minHeight: 52,
    borderRadius: 25,
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    marginTop: 6,
  },
  primaryButtonText: {
    color: "#121212",
    fontSize: 16,
    fontWeight: "bold",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  errorText: {
    color: "#FF6B6B",
    fontSize: 14,
    marginTop: -6,
  },
});

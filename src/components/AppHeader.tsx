import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { onAuthStateChanged, signOut } from "firebase/auth";
import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { auth } from "../services/connectionFirebase";

export default function AppHeader() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
    });

    return unsubscribe;
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    setShowMenu(false);
    Alert.alert("Logout", "Voce foi desconectado.");
  };

  const handleProfileNavigation = () => {
    setShowMenu(false);
    router.push("/(tabs)/user");
  };

  const handleProductRegisterNavigation = () => {
    setShowMenu(false);

    if (!isLoggedIn) {
      Alert.alert(
        "Login necessario",
        "Entre na sua conta para cadastrar produtos."
      );
      router.push("/(tabs)/user");
      return;
    }

    router.push("/product-register");
  };

  return (
    <>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace("/(tabs)")}>
          <Text style={styles.headerTitle}>Tech Store</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setShowMenu((current) => !current)}
        >
          <Ionicons name="menu" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      {showMenu ? (
        <View style={styles.menu}>
          {isLoggedIn ? (
            <>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={handleProfileNavigation}
              >
                <Text style={styles.menuText}>Perfil</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={handleProductRegisterNavigation}
              >
                <Text style={styles.menuText}>Novo produto</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
                <Text style={styles.menuText}>Logout</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setShowMenu(false);
                  router.push("/(tabs)/user");
                }}
              >
                <Text style={styles.menuText}>Login</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setShowMenu(false);
                  router.push("/register");
                }}
              >
                <Text style={styles.menuText}>Cadastro</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 80,
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
  menuButton: {
    padding: 10,
  },
  menu: {
    position: "absolute",
    top: 70,
    right: 20,
    backgroundColor: "#1E1E1E",
    borderRadius: 10,
    padding: 10,
    zIndex: 10,
    elevation: 5,
  },
  menuItem: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  menuText: {
    color: "#FFF",
    fontSize: 16,
  },
});

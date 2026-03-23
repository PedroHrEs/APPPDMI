import { useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { get, ref } from "firebase/database";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, database } from "../services/connectionFirebase";

export default function UserScreens() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{
    name: string;
    email: string;
    phone: string;
  } | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const snapshot = await get(ref(database, `users/${firebaseUser.uid}`));
        const userData = snapshot.val();

        if (!userData) {
          setUser(null);
          Alert.alert("Perfil", "Perfil do usuario nao encontrado.");
        } else {
          setUser({
            name: userData.name ?? "",
            email: userData.email ?? firebaseUser.email ?? "",
            phone: userData.phone ?? "",
          });
        }
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <View style={styles.screen}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.replace("/(tabs)")}>
            <Text style={styles.headerTitle}>Tech Store</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFF" />
        </View>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.screen}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.replace("/(tabs)")}>
            <Text style={styles.headerTitle}>Tech Store</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.container}>
          <Text style={styles.titulo}>Perfil</Text>
          <Text style={styles.label}>Nenhuma informacao de usuario encontrada.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace("/(tabs)")}>
          <Text style={styles.headerTitle}>Tech Store</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.container}>
        <Text style={styles.titulo}>Perfil</Text>
        <Text style={styles.label}>Nome:</Text>
        <Text style={styles.valor}>{user.name}</Text>
        <Text style={styles.label}>Email:</Text>
        <Text style={styles.valor}>{user.email}</Text>
        <Text style={styles.label}>Telefone:</Text>
        <Text style={styles.valor}>{user.phone}</Text>
      </View>
    </View>
  );
}

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

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  titulo: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 32,
    color: "#FFF",
  },

  label: {
    fontSize: 18,
    color: "#FFF",
    marginBottom: 8,
    alignSelf: "flex-start",
    width: "100%",
    textAlign: "left",
  },

  valor: {
    fontSize: 16,
    color: "#DDD",
    marginBottom: 20,
    alignSelf: "flex-start",
    width: "100%",
    textAlign: "left",
    backgroundColor: "#1E1E1E",
    padding: 12,
    borderRadius: 8,
  },
});

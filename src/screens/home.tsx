import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { get, ref } from "firebase/database";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { auth, database } from "../services/connectionFirebase";

type CurrentUser = {
  name: string;
  email: string;
  phone: string;
};

export default function App() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  const isCompactScreen = width < 380;
  const horizontalPadding = width < 480 ? 16 : 24;
  const contentWidth = Math.min(width - horizontalPadding * 2, 920);
  const cardGap = 16;
  const cardSize = isCompactScreen
    ? Math.min(contentWidth, 320)
    : Math.min((contentWidth - cardGap) / 2, 220);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setIsLoggedIn(!!user);

      if (!user) {
        setCurrentUser(null);
        return;
      }

      const snapshot = await get(ref(database, `users/${user.uid}`));
      const userData = snapshot.val();

      if (userData) {
        setCurrentUser({
          name: userData.name ?? "",
          email: userData.email ?? user.email ?? "",
          phone: userData.phone ?? "",
        });
      }
    });
    return unsubscribe;
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    setIsLoggedIn(false);
    setCurrentUser(null);
    setShowMenu(false);
    Alert.alert("Logout", "Voce foi desconectado.");
  };

  const handleProfileNavigation = () => {
    setShowMenu(false);

    if (!currentUser) {
      Alert.alert("Perfil", "Nenhum usuario logado encontrado.");
      return;
    }

    router.push("/(tabs)/user");
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace("/(tabs)")}>
          <Text style={styles.headerTitle}>Tech Store</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setShowMenu(!showMenu)}
        >
          <Ionicons name="menu" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      {showMenu && (
        <View style={styles.menu}>
          {isLoggedIn ? (
            <>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={handleProfileNavigation}
              >
                <Text style={styles.menuText}>Perfil</Text>
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
      )}

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: horizontalPadding },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.descriptionContainer,
            { width: "100%", maxWidth: Math.min(contentWidth, 720) },
          ]}
        >
          <Text
            style={[
              styles.descriptionText,
              {
                fontSize: width < 380 ? 18 : 20,
                paddingTop: width < 380 ? 16 : 30,
              },
            ]}
          >
            Bem-vindo a Tech Store! Encontre notebooks, impressoras, perifericos
            e os melhores produtos de informatica com qualidade e preco justo.
          </Text>
        </View>

        <View style={[styles.content, { width: "100%", maxWidth: contentWidth }]}>
          <TouchableOpacity>
            <ImageBackground
              source={require("../../assets/images/ImCatalogo.png")}
              style={[styles.button, { width: cardSize, height: cardSize }]}
              imageStyle={styles.image}
            >
              <Text style={styles.text}>Catalogo</Text>
            </ImageBackground>
          </TouchableOpacity>

          <TouchableOpacity>
            <ImageBackground
              source={require("../../assets/images/ImOfertas.png")}
              style={[styles.button, { width: cardSize, height: cardSize }]}
              imageStyle={styles.image}
            >
              <Text style={styles.text}>Ofertas</Text>
            </ImageBackground>
          </TouchableOpacity>

          <TouchableOpacity>
            <ImageBackground
              source={require("../../assets/images/ImProdutos.png")}
              style={[styles.button, { width: cardSize, height: cardSize }]}
              imageStyle={styles.image}
            >
              <Text style={styles.text}>Produtos</Text>
            </ImageBackground>
          </TouchableOpacity>

          <TouchableOpacity>
            <ImageBackground
              source={require("../../assets/images/ImSobre.png")}
              style={[styles.button, { width: cardSize, height: cardSize }]}
              imageStyle={styles.image}
              resizeMode="cover"
            >
              <Text style={styles.text}>Contato</Text>
            </ImageBackground>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#030d13",
  },
  scrollContent: {
    alignItems: "center",
    paddingBottom: 24,
  },

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
    zIndex: 1,
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

  descriptionContainer: {
    paddingVertical: 15,
  },

  descriptionText: {
    color: "#DDD",
    textAlign: "center",
    lineHeight: 28,
    fontFamily: "sans-serif",
  },

  content: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 16,
    paddingTop: 20,
  },

  image: {
    borderRadius: 25,
  },

  button: {
    width: 180,
    height: 180,
    justifyContent: "center",
    alignItems: "center",
  },

  text: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 18,
    fontFamily: "sans-serif-medium",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    textAlign: "center",
  },

  loginButton: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 25,
  },

  loginText: {
    color: "#121212",
    fontWeight: "bold",
  },

  registerButton: {
    borderWidth: 1,
    borderColor: "#FFF",
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 25,
  },

  registerText: {
    color: "#FFF",
    fontWeight: "bold",
  },

  logoutButton: {
    backgroundColor: "#FF6B6B",
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 25,
  },

  logoutText: {
    color: "#FFF",
    fontWeight: "bold",
  },

  authContainer: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    paddingVertical: 15,
  },

  footer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    height: 70,
    backgroundColor: "#1E1E1E",
  },

  footerButton: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 10,
  },

  footerText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 14,
  },
});

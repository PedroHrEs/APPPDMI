import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RouteProp, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from "@react-navigation/stack";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

type RootStackParamList = {
  HomeScreens: { justRegistered?: boolean };
  RegisterScreens: undefined;
  LoginScreens: undefined;
  PerfilScreens: { user: { name: string; email: string; phone: string } };
};

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'HomeScreens'>;

type HomeScreenRouteProp = RouteProp<RootStackParamList, 'HomeScreens'>;

export default function App({ route }: { route: HomeScreenRouteProp }) {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string; phone: string } | null>(null);

  useEffect(() => {
    const checkLoginStatus = async () => {
      const loggedIn = await AsyncStorage.getItem("isLoggedIn");
      setIsLoggedIn(loggedIn === "true");
      if (loggedIn === "true") {
        const userData = await AsyncStorage.getItem("currentUser");
        if (userData) {
          setCurrentUser(JSON.parse(userData));
        }
      }
    };
    checkLoginStatus();

    if (route.params?.justRegistered) {
      Alert.alert("Cadastro efetuado", "Bem-vindo à Tech Store!");
    }
  }, [route.params?.justRegistered]);

  const handleLogout = async () => {
    await AsyncStorage.removeItem("isLoggedIn");
    await AsyncStorage.removeItem("currentUser");
    setIsLoggedIn(false);
    setCurrentUser(null);
    Alert.alert("Logout", "Você foi desconectado.");
  };
  return (
    <View style={styles.screen}>
      
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tech Store</Text>
        <TouchableOpacity style={styles.menuButton} onPress={() => setShowMenu(!showMenu)}>
          <Ionicons name="menu" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      {showMenu && (
        <View style={styles.menu}>
          {isLoggedIn ? (
            <>
              <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMenu(false); navigation.navigate("PerfilScreens", { user: currentUser! }); }}>
                <Text style={styles.menuText}>Perfil</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
                <Text style={styles.menuText}>Logout</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMenu(false); navigation.navigate("LoginScreens"); }}>
                <Text style={styles.menuText}>Login</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMenu(false); navigation.navigate("RegisterScreens"); }}>
                <Text style={styles.menuText}>Cadastro</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}

      
      <View style={styles.descriptionContainer}>
        <Text style={styles.descriptionText}>
          Bem-vindo à Tech Store! Encontre notebooks, impressoras,
          periféricos e os melhores produtos de informática com qualidade
          e preço justo.
        </Text>
      </View>

      
      <View style={styles.content}>

        <View style={styles.container}>
          <TouchableOpacity>
            <ImageBackground
              source={require("../../assets/images/ImCatalogo.png")}
              style={styles.button}
              imageStyle={styles.image}
            >
              <Text style={styles.text}>Catálogo</Text>
            </ImageBackground>
          </TouchableOpacity>

          <TouchableOpacity>
            <ImageBackground
              source={require("../../assets/images/ImOfertas.png")}
              style={styles.button}
              imageStyle={styles.image}
            >
              <Text style={styles.text}>Ofertas</Text>
            </ImageBackground>
          </TouchableOpacity>
        </View>

        <View style={styles.container}>
          <TouchableOpacity>
            <ImageBackground
              source={require("../../assets/images/ImProdutos.png")}
              style={styles.button}
              imageStyle={styles.image}
            >
              <Text style={styles.text}>Produtos</Text>
            </ImageBackground>
          </TouchableOpacity>

          <TouchableOpacity>
            <ImageBackground
              source={require("../../assets/images/ImSobre.png")}
              style={styles.button}
              imageStyle={styles.image}
              resizeMode="cover"

            >
              <Text style={styles.text}>Contato</Text>
            </ImageBackground>
          </TouchableOpacity>
        </View>

      </View>
      
      <View style={styles.footer}>
          <TouchableOpacity style={styles.footerButton}>
            <Text style={styles.footerText}>Produtos</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.footerButton}>
              <Text style={styles.footerText}>Contato</Text>
          </TouchableOpacity>
        </View>
      </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#030d13",
  },

  /* HEADER */
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

  /* TEXTO */
  descriptionContainer: {
    paddingHorizontal: 25,
    paddingVertical: 15,
  },

  descriptionText: {
    color: "#DDD",
    textAlign: "center",
    fontSize: 20,
    lineHeight: 22,
    paddingTop: 30,
    fontFamily: "sans-serif"
  },

  /* CONTEÚDO */
  content: {
    flex: 1,
    paddingTop:20
  },

  container: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    marginVertical: 10,
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
  height: 70, // altura fixa (não cresce)
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
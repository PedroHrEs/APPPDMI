import React from "react";
import {
    ImageBackground,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";

export default function App() {
  return (
    <View style={styles.screen}>
      
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tech Store</Text>
      </View>

      
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
            >
              <Text style={styles.text}>Contato</Text>
            </ImageBackground>
          </TouchableOpacity>
        </View>
        <View style={styles.authContainer}>
          <TouchableOpacity style={styles.loginButton}>
            <Text style={styles.loginText}>Login</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.registerButton}>
            <Text style={styles.registerText}>Cadastro</Text>
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
    height: 70,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1E1E1E",
    fontFamily: "sans-serif-medium"
  },

  headerTitle: {
    color: "#FFF",
    fontSize: 22,
    fontWeight: "bold",
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
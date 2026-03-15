import { RouteProp, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Definição do tipo dos parâmetros esperados
interface User {
  name: string;
  email: string;
  phone: string;
}

interface PerfilScreenRouteParams {
  user?: User;
}

type RootStackParamList = {
  HomeScreens: { justRegistered?: boolean };
  RegisterScreens: undefined;
  LoginScreens: undefined;
  PerfilScreens: { user: { name: string; email: string; phone: string } };
};

type PerfilScreenRouteProp = RouteProp<{ PerfilScreens: PerfilScreenRouteParams }, 'PerfilScreens'>;

type PerfilNavigationProp = StackNavigationProp<RootStackParamList, 'PerfilScreens'>;

// Espera receber os dados do usuário via route.params
export default function PerfilScreen({ route }: { route: PerfilScreenRouteProp }) {
  const navigation = useNavigation<PerfilNavigationProp>();
  // Se não houver params, mostra mensagem
  const user = route?.params?.user;

  if (!user) {
    return (
      <View style={styles.screen}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.navigate("HomeScreens" as any)}>
            <Text style={styles.headerTitle}>Tech Store</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.container}>
          <Text style={styles.titulo}>Perfil</Text>
          <Text style={styles.label}>Nenhuma informação de usuário encontrada.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate("HomeScreens" as any)}>
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

  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  titulo: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 32,
    color: '#FFF',
  },
  label: {
    fontSize: 18,
    color: '#FFF',
    marginBottom: 8,
    alignSelf: 'flex-start',
    width: '100%',
    textAlign: 'left',
  },
  valor: {
    fontSize: 16,
    color: '#DDD',
    marginBottom: 20,
    alignSelf: 'flex-start',
    width: '100%',
    textAlign: 'left',
    backgroundColor: '#1E1E1E',
    padding: 12,
    borderRadius: 8,
  },
});

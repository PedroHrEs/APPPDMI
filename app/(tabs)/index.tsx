import { createStackNavigator } from "@react-navigation/stack";
import HomeScreens from "../../src/screens/home"; // importar a tela
import LoginScreens from "../../src/screens/login"; // importar a tela de login
import PerfilScreens from "../../src/screens/perfil"; // importar a tela de perfil
import RegisterScreens from "../../src/screens/register"; // importar a tela de registro

export type RootStackParamList = {
  //lista de telas a serem chamadas em sequência
  HomeScreens: { justRegistered?: boolean };
  RegisterScreens: undefined;
  LoginScreens: undefined;
  PerfilScreens: { user: { name: string; email: string; phone: string } };
};

const Stack = createStackNavigator<RootStackParamList>();

export default function RootStack() {
  return (
    <Stack.Navigator
      initialRouteName="HomeScreens"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen
        name="HomeScreens"
        component={HomeScreens} options={{ headerShown: false}}
      />
      <Stack.Screen
        name="RegisterScreens"
        component={RegisterScreens} options={{ headerShown: false}}
      />
      <Stack.Screen
        name="LoginScreens"
        component={LoginScreens} options={{ headerShown: false}}
      />
      <Stack.Screen
        name="PerfilScreens"
        component={PerfilScreens} options={{ headerShown: false}}
      />
    </Stack.Navigator>
  );
}
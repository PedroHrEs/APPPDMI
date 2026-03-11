import { createStackNavigator } from "@react-navigation/stack";
import HomeScreens from "../../src/screens/home"; // importar a tela

export type RootStackParamList = {
  //lista de telas a serem chamadas em sequência
  HomeScreens: undefined;
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
    </Stack.Navigator>
  );
}
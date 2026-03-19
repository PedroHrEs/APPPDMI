import { createStackNavigator } from "@react-navigation/stack";
import React from "react";
import HomeScreens from "../../src/screens/home";
import LoginScreens from "../../src/screens/login";
import RegisterScreens from "../../src/screens/register";
import UserScreens from "../../src/screens/user";

export type RootStackParamList = {
  HomeScreens: { justRegistered?: boolean } | undefined;
  LoginScreens: undefined;
  RegisterScreens: undefined;
  UserScreens: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function RootStack() {
  return (
    <Stack.Navigator
      initialRouteName="HomeScreens"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="HomeScreens" component={HomeScreens} />
      <Stack.Screen name="LoginScreens" component={LoginScreens} />
      <Stack.Screen name="RegisterScreens" component={RegisterScreens} />
      <Stack.Screen name="UserScreens" component={UserScreens} />
    </Stack.Navigator>
  );
}

import { Stack } from "expo-router";

export default function RootStack() {
  return (
  <Stack>
    <Stack.Screen name="(tabs)" options={{ headerShown: false }}/>
    <Stack.Screen name="register" options={{ headerShown: false }}/>
    <Stack.Screen name="products" options={{ headerShown: false }}/>
  </Stack>
  );
}

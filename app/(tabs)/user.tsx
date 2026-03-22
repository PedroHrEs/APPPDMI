import type { RouteProp } from "@react-navigation/native";
import { onAuthStateChanged } from "firebase/auth";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import LoginScreens from "../../src/screens/login";
import UserScreens from "../../src/screens/user";
import { auth } from "../../src/services/connectionFirebase";
import type { RootStackParamList } from "./index";

export default function UserTab() {
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const userRoute = {} as RouteProp<RootStackParamList, "UserScreens">;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setIsLoggedIn(!!firebaseUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  if (isLoggedIn) {
    return <UserScreens route={userRoute} />;
  }

  return <LoginScreens />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#030d13",
  },
});

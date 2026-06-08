import type { NotificationResponse } from "expo-notifications";
import * as Notifications from "expo-notifications";
import { Stack } from "expo-router";
import { useEffect } from "react";
import { initFirebaseCloudMessaging } from "../src/services/firebaseCloudMessagingService";
import {
  initPriceNotificationListener,
  stopPriceNotificationListener,
} from "../src/services/priceNotificationListener";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function RootStack() {
  useEffect(() => {
    void initFirebaseCloudMessaging();
    void initPriceNotificationListener();
    const removeNotificationListeners = setupNotificationListeners();

    return () => {
      removeNotificationListeners();
      stopPriceNotificationListener();
    };
  }, []);

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ headerShown: false }} />
      <Stack.Screen name="products" options={{ headerShown: false }} />
    </Stack>
  );
}

const setupNotificationListeners = () => {
  const subscription = Notifications.addNotificationResponseReceivedListener(
    (response: NotificationResponse) => {
      const data = response.notification.request.content.data;

      if (data?.productId && data.screen === "ProductDetail") {
        console.log(`Navegando para produto: ${data.productId}`);
      }
    },
  );

  return () => subscription.remove();
};

declare module "react-native-push-notification" {
  type LocalNotificationOptions = {
    title?: string;
    message: string;
    bigText?: string;
    userInteraction?: boolean;
    soundName?: string;
    vibrate?: boolean;
    data?: Record<string, unknown>;
  };

  const PushNotification: {
    localNotification(options: LocalNotificationOptions): void;
  };

  export default PushNotification;
}

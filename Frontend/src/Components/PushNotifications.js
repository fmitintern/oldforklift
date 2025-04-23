import { getMessaging, getToken, onMessage } from "firebase/messaging";
import axios from "axios";
import app from "./firebase";

const messaging = getMessaging(app);

export const requestNotificationPermission = async (userId) => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      const token = await getToken(messaging, { vapidKey: "YOUR_VAPID_KEY" });
      console.log("Notification Token:", token);

      // Send token to server
      await axios.post("http://144.11.1.83:3000/api/save-fcm-token", { userId, token });

      return token;
    } else {
      console.warn("Notification permission denied");
    }
  } catch (error) {
    console.error("Error getting notification permission:", error);
  }
};

// Listen for incoming messages
export const onMessageListener = () =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      console.log("Message received:", payload);
      resolve(payload);
    });
  });

// Unsubscribe from notifications
export const unsubscribeNotifications = async () => {
  try {
    await messaging.deleteToken();
    console.log("Unsubscribed from notifications.");
  } catch (error) {
    console.error("Failed to unsubscribe:", error);
  }
};

export default messaging;

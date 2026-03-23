// src/utils/toast.ts
import { ToastAndroid, Platform } from "react-native";

export const showToast = (msg: string) => {
  if (Platform.OS === "android") {
    ToastAndroid.show(msg, ToastAndroid.SHORT);
  } else {
    // Use any iOS toast library
    console.log("Toast:", msg);
  }
};
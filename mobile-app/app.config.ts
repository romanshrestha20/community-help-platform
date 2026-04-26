import type { ExpoConfig } from "expo/config";

const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

const config: ExpoConfig = {
  name: "community-support",
  slug: "community-support",
  version: "1.0.0",
  orientation: "portrait",

  icon: "./assets/images/icon.png",

  splash: {
    image: "./assets/images/icon.png",
    resizeMode: "contain",
    backgroundColor: "#F6F5F0",
  },

  ios: {
    bundleIdentifier: "com.romann-shrr.mobileapp",
    config: {
      ...(googleMapsApiKey ? { googleMapsApiKey } : {}),
    },
  },

  android: {
    package: "com.romann_shrr.mobileapp",
    adaptiveIcon: {
      foregroundImage: "./assets/images/icon.png",
      backgroundColor: "#F6F5F0",
    },
    config: {
      ...(googleMapsApiKey
        ? {
          googleMaps: {
            apiKey: googleMapsApiKey,
          },
        }
        : {}),
    },
  },

  extra: {
    eas: {
      projectId: "f24e21a6-ad96-4e1a-9421-8c4a0049d288",
    },
  },

  plugins: [
    "@react-native-community/datetimepicker",
    [
      "expo-location",
      {
        locationWhenInUsePermission:
          "Allow this app to access your location so you can discover nearby requests and place requests on the map.",
      },
    ],
  ],
};

export default config;

import type { ExpoConfig } from "expo/config";

const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

const config: ExpoConfig = {
  name: "community-support",
  slug: "community-support",
  version: "1.0.0",
  orientation: "portrait",
  "owner": "romann_shrr",

  icon: "./assets/images/icon.png",

  splash: {
    image: "./assets/images/splash-screen.png",
    resizeMode: "cover",
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
    googleServicesFile: "./google-services.json",
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
      "projectId": "f189da7b-5751-4e9a-bbbf-0f3273b6f6bb",
    }
  },

  plugins: [
    "@react-native-community/datetimepicker",
    [
      "expo-notifications",
      {
        color: "#6AA84F",
      },
    ],
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

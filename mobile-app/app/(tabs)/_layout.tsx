// app/(tabs)/_layout.tsx

import { Tabs } from "expo-router";
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { theme } from "@/design-system";

export default function TabsLayout() {
  return (
     <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: { height: 60, paddingBottom: 5 },
      }}
    >
      <Tabs.Screen 
      name="home" 
      options={{ 
        title: "Home",
        tabBarIcon: ({ color, size }) => (
          <FontAwesome name="home" size={size} color={color} />
        ),
      }} />
        <Tabs.Screen name="profile" 
      options={{
         title: "Profile",
         tabBarIcon: ({ color, size }) => (
           <FontAwesome name="user" size={size} color={color} />
         ),
       }} />
    </Tabs>
  );
}
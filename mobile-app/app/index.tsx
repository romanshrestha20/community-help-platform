// src/app/index.tsx
import { View, Text, Button } from 'react-native';
import { useRouter } from 'expo-router';

export default function Home() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Welcome to the Home Page</Text>
      
      <Button title="Go to Login" onPress={() => router.push('/login')} />
      <Button title="Go to Register" onPress={() => router.push('/register')} />
    </View>
  );
}
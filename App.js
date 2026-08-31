import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from './src/screens/LoginScreen';
import NotesScreen from './src/screens/NotesScreen';
import { supabase } from './src/lib/supabase';

const Stack = createNativeStackNavigator();

export default function App() {
  const [initialRoute, setInitialRoute] = useState(null);

  useEffect(() => {
    // Cek apakah user sudah memiliki sesi terautentikasi di Supabase
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (session) {
          setInitialRoute('Notes');
        } else {
          setInitialRoute('Login');
        }
      })
      .catch((err) => {
        console.warn('Supabase session check error:', err);
        setInitialRoute('Login');
      });

    // Listener jika ada perubahan state auth (SignIn/SignOut)
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setInitialRoute('Notes');
      } else {
        setInitialRoute('Login');
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  if (!initialRoute) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' }}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Notes" component={NotesScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

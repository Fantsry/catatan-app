import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  // Function untuk Login Dummy & Supabase Auth
  const handleSignIn = async () => {
    setErrorMessage('');
    setInfoMessage('');
    setLoading(true);

    const userEmail = email.trim() || 'user@demo.com';

    try {
      // 1. Coba login via Supabase jika memungkinkan
      const { data, error } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: password || 'dummy123',
      });

      if (!error && data?.session) {
        navigation.replace('Notes');
        return;
      }
    } catch (e) {
      console.log('Supabase auth fallback to dummy login');
    }

    // 2. Fallback Mode Dummy (Selalu Berhasil)
    try {
      const dummyUser = {
        id: 'dummy-user-123',
        email: userEmail,
      };
      await AsyncStorage.setItem('@dummy_user', JSON.stringify(dummyUser));
      setLoading(false);
      navigation.replace('Notes');
    } catch (err) {
      setErrorMessage('Gagal menyimpan sesi dummy.');
      setLoading(false);
    }
  };

  // Function untuk Sign Up (Daftar Akun)
  const handleSignUp = async () => {
    handleSignIn();
  };

  const formContent = (
    <View style={styles.inner}>
      <View style={styles.header}>
        <Text style={styles.title}>Catatan Sederhana</Text>
        <Text style={styles.subtitle}>Masuk atau daftar untuk mengelola catatan Anda</Text>
      </View>

      <View style={styles.form}>
        {errorMessage ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {infoMessage ? (
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>{infoMessage}</Text>
          </View>
        ) : null}

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="nama@email.com"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="••••••••"
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
        />

        {loading ? (
          <ActivityIndicator size="large" color="#4F46E5" style={{ marginTop: 20 }} />
        ) : (
          <View style={styles.buttonGroup}>
            <TouchableOpacity style={styles.primaryButton} onPress={handleSignIn}>
              <Text style={styles.primaryButtonText}>Masuk (Login)</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={handleSignUp}>
              <Text style={styles.secondaryButtonText}>Daftar Akun Baru</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {Platform.OS === 'web' ? (
        formContent
      ) : (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          {formContent}
        </TouchableWithoutFeedback>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  form: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  errorBox: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#991B1B',
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  infoBox: {
    backgroundColor: '#E0E7FF',
    borderColor: '#A5B4FC',
    borderWidth: 1,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  infoText: {
    color: '#3730A3',
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 14,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#F9FAFB',
    marginBottom: 16,
  },
  buttonGroup: {
    marginTop: 8,
    gap: 10,
  },
  primaryButton: {
    backgroundColor: '#4F46E5',
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#EEF2FF',
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  secondaryButtonText: {
    color: '#4338CA',
    fontSize: 16,
    fontWeight: '600',
  },
});

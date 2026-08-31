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
import { supabase } from '../lib/supabase';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Function untuk Login
  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Perhatian', 'Email dan password tidak boleh kosong');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        Alert.alert('Gagal Login', error.message);
      } else {
        // Navigasi ke screen Notes setelah login sukses
        navigation.replace('Notes');
      }
    } catch (err) {
      Alert.alert('Gagal Login', err.message || 'Terjadi kesalahan jaringan/konfigurasi Supabase.');
    } finally {
      setLoading(false);
    }
  };

  // Function untuk Sign Up (Daftar Akun Baru)
  const handleSignUp = async () => {
    if (!email || !password) {
      Alert.alert('Perhatian', 'Email dan password tidak boleh kosong');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Perhatian', 'Password minimal 6 karakter');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
      });

      if (error) {
        Alert.alert('Gagal Pendaftaran', error.message);
      } else {
        if (data?.session) {
          Alert.alert('Sukses', 'Pendaftaran berhasil dan Anda telah login!');
          navigation.replace('Notes');
        } else {
          Alert.alert(
            'Sukses Pendaftaran',
            'Akun berhasil dibuat! Silakan cek email Anda untuk konfirmasi (jika email confirmation aktif), atau langsung klik Login.'
          );
        }
      }
    } catch (err) {
      Alert.alert('Gagal Pendaftaran', err.message || 'Terjadi kesalahan jaringan/konfigurasi Supabase.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.inner}>
          <View style={styles.header}>
            <Text style={styles.title}>Catatan Sederhana</Text>
            <Text style={styles.subtitle}>Masuk atau daftar untuk mengelola catatan Anda</Text>
          </View>

          <View style={styles.form}>
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
      </TouchableWithoutFeedback>
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

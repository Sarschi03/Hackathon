import { Ionicons } from '@expo/vector-icons';
import { useMutation } from 'convex/react';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { api } from '@/convex/_generated/api';
import { useAppSession } from '@/hooks/use-app-session';

export default function LoginScreen() {
  const router = useRouter();
  const { sessionToken, isReady } = useAppSession();
  const signIn = useMutation(api.session.signIn);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!sessionToken) {
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      await signIn({ sessionToken, email, password });
      router.replace('/(tabs)');
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Unable to sign in.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.logoWrapper}>
          <View style={styles.logoBox} />
          <Text style={styles.logoText}>
            <Text style={{ fontWeight: '300' }}>First</Text>
            <Text style={{ fontWeight: '700' }}>Line</Text>
          </Text>
        </View>

        <Text style={styles.heading}>Welcome back</Text>
        <Text style={styles.subheading}>Sign in as a patient or responder with your Convex-backed account</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="mail-outline" size={18} color="#9B9EA3" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor="#B0B3B8"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={18} color="#9B9EA3" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#B0B3B8"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={18}
                color="#9B9EA3"
              />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.helperText}>Password checks now happen inside Convex before the app session is attached to the account.</Text>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Pressable
          style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.85 }]}
          onPress={() => void handleLogin()}
          disabled={!isReady || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryBtnText}>{isReady ? 'Sign In' : 'Preparing session...'}</Text>
          )}
        </Pressable>

        <View style={styles.signupRow}>
          <Text style={styles.signupPrompt}>Do not have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/signup')}>
            <Text style={styles.signupLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F7F8FA' },
  scroll: { padding: 28, paddingTop: 72, paddingBottom: 60 },
  logoWrapper: { alignItems: 'center', marginBottom: 40 },
  logoBox: { width: 46, height: 46, backgroundColor: '#1E1E1E', borderRadius: 8, marginBottom: 10 },
  logoText: { fontSize: 20, color: '#1E1E1E', letterSpacing: 0.5 },
  heading: { fontSize: 28, fontWeight: '800', color: '#1E1E1E', marginBottom: 6 },
  subheading: { fontSize: 15, color: '#6C7075', marginBottom: 32 },
  inputGroup: { marginBottom: 18 },
  label: { fontSize: 13, fontWeight: '600', color: '#3A3A3A', marginBottom: 8 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
    paddingHorizontal: 14,
    height: 52,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: '#1E1E1E' },
  eyeBtn: { padding: 4 },
  helperText: { fontSize: 13, color: '#6C7075', lineHeight: 20, marginBottom: 14 },
  errorText: { color: '#D64545', fontSize: 13, marginBottom: 14 },
  primaryBtn: {
    backgroundColor: '#1E1E1E',
    borderRadius: 50,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  primaryBtnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.3 },
  signupRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  signupPrompt: { fontSize: 14, color: '#6C7075' },
  signupLink: { fontSize: 14, fontWeight: '700', color: '#1E1E1E' },
});

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

type Role = 'citizen' | 'responder';

export default function SignupScreen() {
  const router = useRouter();
  const { sessionToken, isReady } = useAppSession();
  const signUp = useMutation(api.session.signUp);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [role, setRole] = useState<Role>('citizen');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = async () => {
    if (!sessionToken) {
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      await signUp({
        sessionToken,
        fullName: name || 'FirstLine User',
        email,
        password,
        role,
      });
      router.replace('/(tabs)');
    } catch (signupError) {
      setError(signupError instanceof Error ? signupError.message : 'Unable to create account.');
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

        <Text style={styles.heading}>Create account</Text>
        <Text style={styles.subheading}>Create a dedicated patient or responder account</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Full Name</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="person-outline" size={18} color="#9B9EA3" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Jenny Doe"
              placeholderTextColor="#B0B3B8"
              autoCapitalize="words"
              value={name}
              onChangeText={setName}
            />
          </View>
        </View>

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
          <Text style={styles.label}>Account Type</Text>
          <View style={styles.roleRow}>
            {[
              { value: 'citizen', label: 'User' },
              { value: 'responder', label: 'Responder' },
            ].map((option) => (
              <Pressable
                key={option.value}
                style={[styles.roleChip, role === option.value && styles.roleChipActive]}
                onPress={() => setRole(option.value as Role)}
              >
                <Text style={[styles.roleChipText, role === option.value && styles.roleChipTextActive]}>
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.helperText}>
            Responders are created as separate accounts and still need verification before receiving alerts.
          </Text>
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

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Confirm Password</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={18} color="#9B9EA3" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Confirm password"
              placeholderTextColor="#B0B3B8"
              secureTextEntry={!showConfirm}
              value={confirm}
              onChangeText={setConfirm}
            />
            <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={styles.eyeBtn}>
              <Ionicons
                name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                size={18}
                color="#9B9EA3"
              />
            </TouchableOpacity>
          </View>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Pressable
          style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.85 }]}
          onPress={() => void handleSignup()}
          disabled={!isReady || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryBtnText}>{isReady ? 'Create Account' : 'Preparing session...'}</Text>
          )}
        </Pressable>

        <View style={styles.loginRow}>
          <Text style={styles.loginPrompt}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.loginLink}>Sign In</Text>
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
  roleRow: { flexDirection: 'row', gap: 10 },
  roleChip: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 14, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: '#E4E7EB' },
  roleChipActive: { backgroundColor: '#1E1E1E', borderColor: '#1E1E1E' },
  roleChipText: { color: '#1E1E1E', fontWeight: '600' },
  roleChipTextActive: { color: '#FFFFFF' },
  helperText: { fontSize: 12, lineHeight: 18, color: '#6C7075', marginTop: 8 },
  errorText: { color: '#D64545', fontSize: 13, marginBottom: 14 },
  primaryBtn: { backgroundColor: '#1E1E1E', borderRadius: 50, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  primaryBtnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.3 },
  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  loginPrompt: { fontSize: 14, color: '#6C7075' },
  loginLink: { fontSize: 14, fontWeight: '700', color: '#1E1E1E' },
});

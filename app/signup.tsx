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
import { useLocalization } from '@/hooks/use-localization';

type Role = 'citizen' | 'responder';

export default function SignupScreen() {
  const router = useRouter();
  const { t } = useLocalization();
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

        <Text style={styles.heading}>{t('signup_title')}</Text>
        <Text style={styles.subheading}>{t('signup_subtitle')}</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('signup_name')}</Text>
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
          <Text style={styles.label}>{t('login_email')}</Text>
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
          <Text style={styles.label}>{t('signup_type')}</Text>
          <View style={styles.roleRow}>
            {[
              { value: 'citizen', label: t('role_user') },
              { value: 'responder', label: t('role_responder') },
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
          <Text style={styles.label}>{t('login_password')}</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={18} color="#9B9EA3" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder={t('login_password')}
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
          <Text style={styles.label}>{t('signup_confirm')}</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={18} color="#9B9EA3" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder={t('signup_confirm')}
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
            <Text style={styles.primaryBtnText}>{isReady ? t('btn_create_account') : t('login_title')}</Text>
          )}
        </Pressable>

        <View style={styles.signupRow}>
          <Text style={styles.signupPrompt}>{t('signup_already')} </Text>
          <TouchableOpacity onPress={() => router.push('/login')}>
            <Text style={styles.signupLink}>{t('btn_login')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F2F3F5' },
  scroll: { padding: 28, paddingTop: 72, paddingBottom: 60 },
  logoWrapper: { alignItems: 'center', marginBottom: 40 },
  logoBox: { width: 46, height: 46, backgroundColor: '#1A1C22', borderRadius: 8, marginBottom: 10 },
  logoText: { fontSize: 20, color: '#1A1C22', letterSpacing: 0.5, fontFamily: 'Inter' },
  heading: { fontSize: 28, fontWeight: '800', color: '#1A1C22', marginBottom: 6, fontFamily: 'InterBold' },
  subheading: { fontSize: 15, color: '#64748B', marginBottom: 32, fontFamily: 'Inter' },
  inputGroup: { marginBottom: 18 },
  label: { fontSize: 13, fontWeight: '600', color: '#1A1C22', marginBottom: 8, fontFamily: 'InterSemiBold' },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    height: 52,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: '#1A1C22', fontFamily: 'Inter' },
  eyeBtn: { padding: 4 },
  roleRow: { flexDirection: 'row', gap: 10 },
  roleChip: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 14, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  roleChipActive: { backgroundColor: '#1A1C22', borderColor: '#1A1C22' },
  roleChipText: { color: '#1A1C22', fontWeight: '600', fontFamily: 'InterSemiBold' },
  roleChipTextActive: { color: '#FFFFFF' },
  helperText: { fontSize: 12, lineHeight: 18, color: '#64748B', marginTop: 8, fontFamily: 'Inter' },
  errorText: { color: '#DC2626', fontSize: 13, marginBottom: 14, fontFamily: 'Inter' },
  primaryBtn: { backgroundColor: '#1A1C22', borderRadius: 50, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  primaryBtnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.3, fontFamily: 'InterBold' },
  signupRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  signupPrompt: { fontSize: 14, color: '#64748B', fontFamily: 'Inter' },
  signupLink: { fontSize: 14, fontWeight: '700', color: '#1A1C22', fontFamily: 'InterBold' },
  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  loginPrompt: { fontSize: 14, color: '#64748B', fontFamily: 'Inter' },
  loginLink: { fontSize: 14, fontWeight: '700', color: '#1A1C22', fontFamily: 'InterBold' },
});

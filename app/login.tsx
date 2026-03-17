import { api } from '@/convex/_generated/api';
import { useAppSession } from '@/hooks/use-app-session';
import { useLocalization } from '@/hooks/use-localization';
import { Ionicons } from '@expo/vector-icons';
import { useMutation } from 'convex/react';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
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

export default function LoginScreen() {
  const router = useRouter();
  const { t } = useLocalization();
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
          <Image
            source={require('../assets/images/icon_black.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.logoText}>
            <Text style={{ fontWeight: '300' }}>Life</Text>
            <Text style={{ fontWeight: '500' }}>Line</Text>
          </Text>
        </View>

        <Text style={styles.heading}>{t('login_title')}</Text>
        <Text style={styles.subheading}>{t('login_subtitle')}</Text>

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

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Pressable
          style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.85 }]}
          onPress={() => void handleLogin()}
          disabled={!isReady || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryBtnText}>{isReady ? t('btn_login') : 'Preparing session...'}</Text>
          )}
        </Pressable>

        <View style={styles.signupRow}>
          <Text style={styles.signupPrompt}>{t('login_no_account')} </Text>
          <TouchableOpacity onPress={() => router.push('/signup')}>
            <Text style={styles.signupLink}>{t('btn_signup')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F2F3F5' },
  scroll: { padding: 28, paddingTop: 72, paddingBottom: 60 },
  logoWrapper: {
    alignItems: 'center',
    marginBottom: 60,
    marginTop: -40,
  },
  logoImage: {
    width: 100,
    height: 100,
    marginBottom: -25,
  },
  logoText: {
    fontSize: 18,
    color: '#1E1E1E',
    letterSpacing: 0.5,
    fontFamily: 'Inter',
  },
  heading: { fontSize: 28, fontWeight: '800', color: '#1A1C22', marginBottom: 6, fontFamily: 'InterBold' },
  subheading: { fontSize: 15, color: '#64748B', marginBottom: 60, fontFamily: 'Inter' },
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
  helperText: { fontSize: 13, color: '#64748B', lineHeight: 20, marginBottom: 14, fontFamily: 'Inter' },
  errorText: { color: '#DC2626', fontSize: 13, marginBottom: 14, fontFamily: 'Inter' },
  primaryBtn: {
    backgroundColor: '#1A1C22',
    borderRadius: 50,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    marginTop: 60,
  },
  primaryBtnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.3, fontFamily: 'InterBold' },
  signupRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  signupPrompt: { fontSize: 14, color: '#64748B', fontFamily: 'Inter' },
  signupLink: { fontSize: 14, fontWeight: '700', color: '#1A1C22', fontFamily: 'InterBold' },
});

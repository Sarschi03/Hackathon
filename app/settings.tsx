import { api } from '@/convex/_generated/api';
import { useAppSession } from '@/hooks/use-app-session';
import { useLocalization } from '@/hooks/use-localization';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery } from 'convex/react';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

type Locale = 'en' | 'es' | 'fr' | 'de' | 'sl' | 'it';

export default function SettingsScreen() {
  const router = useRouter();
  const { sessionToken, logout } = useAppSession();
  const { t, locale, setLocale } = useLocalization();
  const profile = useQuery(
    api.profiles.getMyProfile,
    sessionToken ? { sessionToken } : 'skip',
  );
  const saveProfile = useMutation(api.profiles.upsertMyProfile);

  const [form, setForm] = useState({
    shareMedicalOnEmergency: true,
    shareLiveLocationOnEmergency: true,
    age: '',
    bloodGroup: '',
    allergiesText: '',
    conditionsText: '',
    medicationsText: '',
  });

  useEffect(() => {
    if (profile) {
      setForm({
        shareMedicalOnEmergency: profile.shareMedicalOnEmergency,
        shareLiveLocationOnEmergency: profile.shareLiveLocationOnEmergency,
        age: profile.age ?? '',
        bloodGroup: profile.bloodGroup ?? '',
        allergiesText: profile.allergiesText ?? '',
        conditionsText: profile.conditionsText ?? '',
        medicationsText: profile.medicationsText ?? '',
      });
    }
  }, [profile]);

  const [langModalVisible, setLangModalVisible] = useState(false);

  const languageMap: Record<Locale, string> = {
    en: 'English',
    es: 'Español',
    fr: 'Français',
    de: 'Deutsch',
    sl: 'Slovenščina',
    it: 'Italiano',
  };

  const handleLogout = () => {
    Alert.alert(
      t('settings_logout_confirm_title'),
      t('settings_logout_confirm_desc'),
      [
        { text: t('btn_cancel'), style: 'cancel' },
        { 
          text: t('btn_logout'), 
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/login');
          }
        },
      ]
    );
  };

  const handleUpdate = async (key: string, value: boolean) => {
    const newForm = { ...form, [key]: value };
    setForm(newForm);
    if (!sessionToken) return;
    try {
      await saveProfile({ sessionToken, ...newForm });
    } catch (e) {
      Alert.alert('Update failed', 'Could not sync settings.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1A1C22" />
        </Pressable>
        <Text style={styles.headerTitle}>{t('settings_title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.sectionTitle}>{t('settings_privacy')}</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.textColumn}>
              <Text style={styles.label}>{t('settings_share_location')}</Text>
              <Text style={styles.sublabel}>{t('settings_share_location')}</Text>
            </View>
            <Switch
              value={form.shareLiveLocationOnEmergency}
              onValueChange={(v) => handleUpdate('shareLiveLocationOnEmergency', v)}
              trackColor={{ false: '#D1D5DB', true: '#4BAEE8' }}
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>App Preferences</Text>
        <View style={styles.card}>
          <Pressable style={styles.row} onPress={() => setLangModalVisible(true)}>
            <View style={styles.textColumn}>
              <Text style={styles.label}>{t('settings_language')}</Text>
              <Text style={styles.sublabel}>{languageMap[locale]}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </Pressable>
        </View>

        <View style={styles.card}>
          <Pressable style={styles.row} onPress={handleLogout}>
            <View style={styles.textColumn}>
              <Text style={[styles.label, { color: '#EF4444' }]}>{t('settings_logout')}</Text>
              <Text style={styles.sublabel}>{t('settings_logout_desc')}</Text>
            </View>
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Text style={styles.versionText}>FirstLine v1.0.4</Text>
        </View>
      </ScrollView>

      {/* Language Modal */}
      <Modal visible={langModalVisible} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setLangModalVisible(false)}>
          <View style={styles.dropdownMenu}>
            {(Object.keys(languageMap) as Locale[]).map((key) => (
              <Pressable
                key={key}
                style={styles.dropdownItem}
                onPress={() => {
                  setLocale(key);
                  setLangModalVisible(false);
                }}
              >
                <Text style={[styles.dropdownItemText, locale === key && { color: '#4BAEE8', fontWeight: '700' }]}>
                  {languageMap[key]}
                </Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F2F3F5' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 24,
    backgroundColor: '#F2F3F5',
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1C22',
    fontFamily: 'InterBold',
  },
  container: { padding: 20 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    marginTop: 8,
    fontFamily: 'InterSemiBold',
    paddingLeft: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  textColumn: { flex: 1, paddingRight: 16 },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1C22',
    fontFamily: 'InterSemiBold',
    marginBottom: 2,
  },
  sublabel: {
    fontSize: 13,
    color: '#6B7280',
    fontFamily: 'Inter',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: -16,
  },
  footer: { marginTop: 20, alignItems: 'center' },
  versionText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'Inter',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownMenu: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 8,
    width: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  dropdownItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#1A1C22',
    textAlign: 'center',
    fontFamily: 'Inter',
  },
});

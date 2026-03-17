import { useLocalization } from '@/hooks/use-localization';
import { api } from '@/convex/_generated/api';
import { useAppSession } from '@/hooks/use-app-session';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery } from 'convex/react';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

export default function MedicalScreen() {
  const router = useRouter();
  const { t } = useLocalization();
  const { sessionToken, viewer } = useAppSession();
  const viewerUser = (viewer as any)?.user;
  const profile = useQuery(
    api.profiles.getMyProfile,
    sessionToken ? { sessionToken } : 'skip',
  );
  const saveProfile = useMutation(api.profiles.upsertMyProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    age: '',
    bloodGroup: '',
    allergiesText: '',
    conditionsText: '',
    medicationsText: '',
    shareMedicalOnEmergency: true,
    shareLiveLocationOnEmergency: true,
  });

  useEffect(() => {
    if (!profile) {
      return;
    }
    setForm({
      age: profile.age ?? '',
      bloodGroup: profile.bloodGroup ?? '',
      allergiesText: profile.allergiesText ?? '',
      conditionsText: profile.conditionsText ?? '',
      medicationsText: profile.medicationsText ?? '',
      shareMedicalOnEmergency: profile.shareMedicalOnEmergency,
      shareLiveLocationOnEmergency: profile.shareLiveLocationOnEmergency,
    });
  }, [profile]);

  const handleSave = async () => {
    if (!sessionToken) {
      return;
    }
    try {
      await saveProfile({ sessionToken, ...form });
      setIsEditing(false);
    } catch (error) {
      Alert.alert('Profile save failed', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  const handleUpdate = (key: keyof typeof form, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          <View style={styles.cardHeader}>
            <Pressable
              onPress={() => router.push('/settings')}
              style={styles.cardIconButton}
            >
              <Ionicons name="settings-outline" size={20} color="#666666" />
            </Pressable>
            <Pressable
              onPress={() => (isEditing ? void handleSave() : setIsEditing(true))}
              style={[styles.cardIconButton, { marginTop: 12 }]}
            >
              <Text style={styles.editIconText}>{isEditing ? t('btn_save') : t('btn_edit')}</Text>
            </Pressable>
          </View>

          <View style={styles.avatarWrapper}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={80} color="#BDC3C7" />
            </View>
          </View>

          <Text style={styles.name}>{viewerUser?.fullName ?? 'FirstLine User'}</Text>
          <Text style={styles.idNumber}>Convex-backed emergency medical summary</Text>

          <View style={styles.infoBar}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>{t('medical_age')}</Text>
              {isEditing ? (
                <TextInput
                  style={styles.infoInput}
                  value={form.age}
                  onChangeText={(t) => handleUpdate('age', t)}
                  keyboardType="number-pad"
                />
              ) : (
                <Text style={styles.infoValue}>{form.age || '-'}</Text>
              )}
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>{t('medical_blood_group')}</Text>
              {isEditing ? (
                <TextInput
                  style={styles.infoInput}
                  value={form.bloodGroup}
                  onChangeText={(t) => handleUpdate('bloodGroup', t)}
                />
              ) : (
                <Text style={styles.infoValue}>{form.bloodGroup || '-'}</Text>
              )}
            </View>
          </View>
        </View>

        <InfoCard
          icon="medical"
          title={t('medical_medication')}
          value={form.medicationsText}
          editing={isEditing}
          onChangeText={(t) => handleUpdate('medicationsText', t)}
        />
        <InfoCard
          icon="warning"
          title={t('medical_allergies')}
          value={form.allergiesText}
          editing={isEditing}
          onChangeText={(t) => handleUpdate('allergiesText', t)}
        />
        <InfoCard
          icon="document-text"
          title={t('medical_history')}
          value={form.conditionsText}
          editing={isEditing}
          onChangeText={(t) => handleUpdate('conditionsText', t)}
        />

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

type InfoCardProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  value: string;
  editing: boolean;
  onChangeText: (t: string) => void;
};

function InfoCard({ icon, title, value, editing, onChangeText }: InfoCardProps) {
  return (
    <View style={infoStyles.card}>
      <View style={infoStyles.cardContent}>
        <View style={infoStyles.header}>
          <View style={infoStyles.iconCircle}>
            <Ionicons name={icon} size={18} color="#A5A5A5" />
          </View>
          <Text style={infoStyles.title}>{title}</Text>
        </View>
        {editing ? (
          <TextInput style={infoStyles.input} value={value} onChangeText={onChangeText} multiline />
        ) : (
          <Text style={infoStyles.valueRow}>
            <Text style={infoStyles.value}>{value || 'No data added yet.'}</Text>
          </Text>
        )}
      </View>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  card: { 
    backgroundColor: '#FFFFFF', 
    borderRadius: 24, 
    marginBottom: 16, 
    overflow: 'hidden',
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 8 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 16, 
    elevation: 3 
  },
  cardContent: {
    padding: 20,
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  iconCircle: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  title: { fontSize: 16, fontWeight: '600', color: '#1A1C22', fontFamily: 'InterSemiBold' },
  valueRow: {
    marginTop: 4,
  },
  value: { fontSize: 14, color: '#666666', lineHeight: 22, fontFamily: 'Inter' },
  input: {
    fontSize: 14,
    color: '#1E1E1E',
    lineHeight: 22,
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 70,
    textAlignVertical: 'top',
    fontFamily: 'Inter',
  },
});

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F2F3F5' },
  container: { padding: 20, paddingTop: 50 },
  profileCard: { 
    backgroundColor: '#FFFFFF', 
    borderRadius: 24, 
    paddingTop: 50, 
    paddingBottom: 24, 
    paddingHorizontal: 24, 
    alignItems: 'center', 
    marginBottom: 16, 
    overflow: 'hidden',
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 8 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 16, 
    elevation: 3,
    position: 'relative',
  },
  cardHeader: {
    position: 'absolute',
    top: 16,
    right: 16,
    alignItems: 'flex-end',
  },
  cardIconButton: {
    padding: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 24,
    minHeight: 48,
    minWidth: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editIconText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
    fontFamily: 'InterBold',
  },
  avatarWrapper: { marginBottom: 16 },
  avatar: { width: 110, height: 110, borderRadius: 55, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: '#FFFFFF' },
  name: { fontSize: 22, fontWeight: '800', color: '#1A1C22', marginBottom: 2, letterSpacing: -0.5, fontFamily: 'InterBold' },
  idNumber: { fontSize: 13, color: '#94A3B8', fontWeight: '400', marginBottom: 20, fontFamily: 'Inter' },
  infoBar: { flexDirection: 'row', width: '100%', paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' },
  infoItem: { flex: 1, alignItems: 'center', gap: 6 },
  infoDivider: { width: 1, backgroundColor: 'rgba(0,0,0,0.1)', marginHorizontal: 16, marginVertical: 4 },
  infoLabel: { fontSize: 11, color: '#94A3B8', fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: 'InterSemiBold' },
  infoValue: { fontSize: 20, fontWeight: '700', color: '#1A1C22', letterSpacing: -0.5, fontFamily: 'InterBold' },
  infoInput: { fontSize: 20, fontWeight: '700', color: '#1A1C22', textAlign: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.1)', minWidth: 40, fontFamily: 'InterBold' },
});

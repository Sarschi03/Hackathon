import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery } from 'convex/react';
import React, { useEffect, useState } from 'react';
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
import { api } from '@/convex/_generated/api';
import { useAppSession } from '@/hooks/use-app-session';

export default function MedicalScreen() {
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
      <View style={styles.topNav}>
        <View style={styles.logoMark}>
          <View style={styles.logoBox} />
          <Text style={styles.logoText}>
            <Text style={{ fontWeight: '300' }}>First</Text>
            <Text style={{ fontWeight: '700' }}>Line</Text>
          </Text>
        </View>
        <Text style={styles.navTitle}>Medical Profile</Text>
        <Pressable
          onPress={() => (isEditing ? void handleSave() : setIsEditing(true))}
          style={({ pressed }) => [styles.editButton, pressed && { opacity: 0.75 }]}
        >
          <Text style={styles.editButtonText}>{isEditing ? 'Save' : 'Edit'}</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={80} color="#BDC3C7" />
            </View>
          </View>

          <Text style={styles.name}>{viewerUser?.fullName ?? 'FirstLine User'}</Text>
          <Text style={styles.idNumber}>Convex-backed emergency medical summary</Text>

          <View style={styles.infoBar}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Age</Text>
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
              <Text style={styles.infoLabel}>Blood Group</Text>
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
          title="Current Medication"
          value={form.medicationsText}
          editing={isEditing}
          onChangeText={(t) => handleUpdate('medicationsText', t)}
        />
        <InfoCard
          icon="warning"
          title="Known Allergies"
          value={form.allergiesText}
          editing={isEditing}
          onChangeText={(t) => handleUpdate('allergiesText', t)}
        />
        <InfoCard
          icon="document-text"
          title="Medical History"
          value={form.conditionsText}
          editing={isEditing}
          onChangeText={(t) => handleUpdate('conditionsText', t)}
        />

        <View style={styles.privacyCard}>
          <Text style={styles.privacyTitle}>Emergency sharing</Text>
          <View style={styles.privacyRow}>
            <Text style={styles.privacyLabel}>Share medical summary during incidents</Text>
            <Switch
              value={form.shareMedicalOnEmergency}
              onValueChange={(value) => handleUpdate('shareMedicalOnEmergency', value)}
              disabled={!isEditing}
            />
          </View>
          <View style={styles.privacyRow}>
            <Text style={styles.privacyLabel}>Share live location during incidents</Text>
            <Switch
              value={form.shareLiveLocationOnEmergency}
              onValueChange={(value) => handleUpdate('shareLiveLocationOnEmergency', value)}
              disabled={!isEditing}
            />
          </View>
        </View>

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
      <View style={infoStyles.header}>
        <View style={infoStyles.iconCircle}>
          <Ionicons name={icon} size={18} color="#000" />
        </View>
        <Text style={infoStyles.title}>{title}</Text>
      </View>
      {editing ? (
        <TextInput style={infoStyles.input} value={value} onChangeText={onChangeText} multiline />
      ) : (
        <Text style={infoStyles.value}>{value || 'No data added yet.'}</Text>
      )}
    </View>
  );
}

const infoStyles = StyleSheet.create({
  card: { backgroundColor: '#FFFFFF', borderRadius: 36, padding: 24, marginBottom: 16 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  iconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0, 0, 0, 0.03)', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  title: { fontSize: 18, fontWeight: '600', color: '#000' },
  value: { fontSize: 15, color: '#4A4A4A', lineHeight: 23 },
  input: {
    fontSize: 15,
    color: '#1E1E1E',
    lineHeight: 23,
    backgroundColor: '#F5F6FA',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E1E5EB',
    minHeight: 70,
    textAlignVertical: 'top',
  },
});

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F2F2F6' },
  topNav: { backgroundColor: '#F2F2F6', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingTop: 18, paddingBottom: 18 },
  logoMark: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoBox: { width: 28, height: 28, backgroundColor: '#000', borderRadius: 5 },
  logoText: { fontSize: 15, color: '#000' },
  navTitle: { fontSize: 17, fontWeight: '700', color: '#000', letterSpacing: 0.3 },
  editButton: { backgroundColor: 'rgba(0,0,0,0.05)', borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)', paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20 },
  editButtonText: { color: '#000', fontWeight: '600', fontSize: 13 },
  container: { padding: 24, paddingTop: 60 },
  profileCard: { backgroundColor: '#FFFFFF', borderRadius: 36, paddingTop: 90, paddingBottom: 24, paddingHorizontal: 24, alignItems: 'center', marginBottom: 20, position: 'relative' },
  avatarWrapper: { position: 'absolute', top: -75, alignSelf: 'center' },
  avatar: { width: 150, height: 150, borderRadius: 75, backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center', borderWidth: 6, borderColor: '#FFFFFF' },
  name: { fontSize: 28, fontWeight: '700', color: '#000', marginBottom: 4, letterSpacing: -0.5 },
  idNumber: { fontSize: 14, color: '#8E8E93', fontWeight: '500', marginBottom: 24 },
  infoBar: { flexDirection: 'row', width: '100%', paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' },
  infoItem: { flex: 1, alignItems: 'center', gap: 6 },
  infoDivider: { width: 1, backgroundColor: 'rgba(0,0,0,0.1)', marginHorizontal: 16, marginVertical: 4 },
  infoLabel: { fontSize: 12, color: '#8E8E93', fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 },
  infoValue: { fontSize: 24, fontWeight: '600', color: '#000', letterSpacing: -0.5 },
  infoInput: { fontSize: 24, fontWeight: '600', color: '#000', textAlign: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.2)', minWidth: 40 },
  privacyCard: { backgroundColor: '#FFFFFF', borderRadius: 28, padding: 20 },
  privacyTitle: { fontSize: 18, fontWeight: '700', color: '#111111', marginBottom: 12 },
  privacyRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 16, alignItems: 'center', marginBottom: 10 },
  privacyLabel: { flex: 1, fontSize: 14, lineHeight: 20, color: '#4B5563' },
});

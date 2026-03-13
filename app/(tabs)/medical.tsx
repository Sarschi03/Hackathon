import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

export default function MedicalScreen() {
  const [isEditing, setIsEditing] = useState(false);

  const [profile, setProfile] = useState({
    name: 'Jenny Doe',
    age: '32',
    bloodType: 'O+',
    allergies: 'Penicillin, Peanuts, Latex',
    history: 'Asthma (diagnosed 2012)\nAppendectomy (2018)',
    medication: 'Albuterol inhaler (as needed)\nZyrtec 10mg (daily)',
  });

  const handleUpdate = (key: keyof typeof profile, value: string) => {
    setProfile((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Light top navigation bar (matching home) */}
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
          onPress={() => setIsEditing(!isEditing)}
          style={({ pressed }) => [styles.editButton, pressed && { opacity: 0.75 }]}
        >
          <Text style={styles.editButtonText}>{isEditing ? 'Save' : 'Edit'}</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile card with larger avatar overlapping */}
        <View style={styles.profileCard}>
          {/* Avatar centered, overlapping the top of the card */}
          <View style={styles.avatarWrapper}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={80} color="#BDC3C7" />
            </View>
          </View>

          {isEditing ? (
            <TextInput
              style={styles.nameInput}
              value={profile.name}
              onChangeText={(t) => handleUpdate('name', t)}
            />
          ) : (
            <Text style={styles.name}>{profile.name}</Text>
          )}
          <Text style={styles.idNumber}>Health ID: 9482-12-XXX</Text>

          {/* Info bar: Age + Blood Group without black box */}
          <View style={styles.infoBar}>
            <View style={styles.infoItem}>
              <View style={infoStyles.iconCircle}>
                <Ionicons name="calendar-outline" size={16} color="#000" />
              </View>
              <Text style={styles.infoLabel}>Age</Text>
              {isEditing ? (
                <TextInput
                  style={styles.infoInput}
                  value={profile.age}
                  onChangeText={(t) => handleUpdate('age', t)}
                  keyboardType="number-pad"
                />
              ) : (
                <Text style={styles.infoValue}>{profile.age}</Text>
              )}
            </View>

            <View style={styles.infoDivider} />

            <View style={styles.infoItem}>
               <View style={infoStyles.iconCircle}>
                <Ionicons name="water-outline" size={16} color="#000" />
              </View>
              <Text style={styles.infoLabel}>Blood Group</Text>
              {isEditing ? (
                <TextInput
                  style={styles.infoInput}
                  value={profile.bloodType}
                  onChangeText={(t) => handleUpdate('bloodType', t)}
                />
              ) : (
                <Text style={styles.infoValue}>{profile.bloodType}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Info sections */}
        <View style={styles.sections}>
          <InfoCard
            icon="medical"
            title="Current Medication"
            value={profile.medication}
            editing={isEditing}
            onChangeText={(t) => handleUpdate('medication', t)}
          />
          <InfoCard
            icon="warning"
            title="Known Allergies"
            value={profile.allergies}
            editing={isEditing}
            onChangeText={(t) => handleUpdate('allergies', t)}
          />
          <InfoCard
            icon="document-text"
            title="Medical History"
            value={profile.history}
            editing={isEditing}
            onChangeText={(t) => handleUpdate('history', t)}
          />
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
        <TextInput
          style={infoStyles.input}
          value={value}
          onChangeText={onChangeText}
          multiline
        />
      ) : (
        <Text style={infoStyles.value}>{value}</Text>
      )}
    </View>
  );
}

const infoStyles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 36, // matched home
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 2,
    shadowOffset: { width: 0, height: 8 },
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  value: {
    fontSize: 15,
    color: '#4A4A4A',
    lineHeight: 23,
    fontWeight: '400',
  },
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
  safeArea: {
    flex: 1,
    backgroundColor: '#F2F2F6', // changed from darker gray to match home
  },
  /* ── Light top bar ── */
  topNav: {
    backgroundColor: '#F2F2F6', // changed to matching background
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 18,
  },
  logoMark: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoBox: {
    width: 28,
    height: 28,
    backgroundColor: '#000', // black logo box
    borderRadius: 5,
  },
  logoText: {
    fontSize: 15,
    color: '#000', // black text
  },
  navTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#000', // black text
    letterSpacing: 0.3,
  },
  editButton: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
  },
  editButtonText: {
    color: '#000', // black text
    fontWeight: '600',
    fontSize: 13,
  },
  /* ── Content ── */
  container: {
    padding: 24,
    paddingTop: 60, // added distance to make room for bigger avatar
  },
  /* ── Profile card ── */
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 36, // matched home styles
    paddingTop: 90,   // increased space for larger avatar overlap
    paddingBottom: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 2,
    shadowOffset: { width: 0, height: 8 },
    position: 'relative',
  },
  avatarWrapper: {
    position: 'absolute',
    top: -75, // moved up to match larger size
    alignSelf: 'center',
  },
  avatar: {
    width: 150, // previously 110, made considerably bigger
    height: 150,
    borderRadius: 75,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 6, // thicker border
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 6,
  },
  name: {
    fontSize: 28, // a bit bigger to match larger layout
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  nameInput: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
    textAlign: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#000',
  },
  idNumber: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
    marginBottom: 24,
  },
  /* ── Info bar ── */
  infoBar: {
    flexDirection: 'row',
    width: '100%',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)', // substitute for separate glass bar box
  },
  infoItem: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  infoDivider: {
    width: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginHorizontal: 16,
    marginVertical: 4,
  },
  infoLabel: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
    letterSpacing: -0.5,
  },
  infoInput: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.2)',
    minWidth: 40,
  },
  sections: {
    marginTop: 6,
  },
});

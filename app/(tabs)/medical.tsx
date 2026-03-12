import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, SafeAreaView, TextInput, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function MedicalScreen() {
  const [isEditing, setIsEditing] = useState(false);
  
  const [profile, setProfile] = useState({
    name: 'Jenny Doe',
    bloodType: 'O Positive (O+)',
    allergies: 'Penicillin, Peanuts, Latex',
    history: 'Asthma (diagnosed 2012)\nAppendectomy (2018)',
    medication: 'Albuterol inhaler (as needed)\nZyrtec 10mg (daily)',
    weight: '65 kg',
    height: '168 cm',
  });

  const handleUpdate = (key: keyof typeof profile, value: string) => {
    setProfile(prev => ({ ...prev, [key]: value }));
  };

  const InfoCard = ({ title, icon, valueKey, multiline=false }: { title: string, icon: any, valueKey: keyof typeof profile, multiline?: boolean }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Ionicons name={icon} size={22} color="#4B7B4B" />
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      {isEditing ? (
        <TextInput
          style={[styles.input, multiline && styles.inputMultiline]}
          value={profile[valueKey]}
          onChangeText={(text) => handleUpdate(valueKey, text)}
          multiline={multiline}
        />
      ) : (
        <Text style={styles.cardValue}>{profile[valueKey]}</Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topNav}>
        <Text style={styles.navTitle}>Medical Profile</Text>
        <Pressable onPress={() => setIsEditing(!isEditing)} style={styles.editButton}>
          <Text style={styles.editButtonText}>{isEditing ? 'Save' : 'Edit'}</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={40} color="#BDC3C7" />
          </View>
          {isEditing ? (
            <TextInput
              style={styles.nameInput}
              value={profile.name}
              onChangeText={(text) => handleUpdate('name', text)}
            />
          ) : (
            <Text style={styles.name}>{profile.name}</Text>
          )}
          <Text style={styles.idNumber}>Health ID: 9482-12-XXX</Text>
        </View>

        {/* Vital Stats Row */}
        <View style={styles.row}>
          <View style={[styles.card, {flex: 1, marginRight: 8}]}>
            <Text style={styles.cardTitleSmall}>Weight</Text>
            {isEditing ? (
              <TextInput style={styles.inputSmall} value={profile.weight} onChangeText={t => handleUpdate('weight', t)} />
            ) : <Text style={styles.cardValueSmall}>{profile.weight}</Text>}
          </View>
          <View style={[styles.card, {flex: 1, marginLeft: 8}]}>
            <Text style={styles.cardTitleSmall}>Height</Text>
            {isEditing ? (
              <TextInput style={styles.inputSmall} value={profile.height} onChangeText={t => handleUpdate('height', t)} />
            ) : <Text style={styles.cardValueSmall}>{profile.height}</Text>}
          </View>
        </View>

        {/* Detailed Info */}
        <View style={styles.section}>
          <InfoCard title="Blood Group" icon="water" valueKey="bloodType" />
          <InfoCard title="Known Allergies" icon="warning" valueKey="allergies" multiline />
          <InfoCard title="Medical History" icon="document-text" valueKey="history" multiline />
          <InfoCard title="Current Medication" icon="medical" valueKey="medication" multiline />
        </View>
        
        <View style={{height: 30}} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  topNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 10,
    backgroundColor: '#F7F8FA',
  },
  navTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1E1E1E',
  },
  editButton: {
    backgroundColor: '#E8F8E3',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  editButtonText: {
    color: '#4B7B4B',
    fontWeight: '700',
    fontSize: 14,
  },
  container: {
    padding: 24,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 4,
    borderColor: '#E8F8E3',
  },
  name: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1E1E1E',
    marginBottom: 4,
  },
  nameInput: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1E1E1E',
    marginBottom: 4,
    textAlign: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#4B7B4B',
  },
  idNumber: {
    fontSize: 14,
    color: '#6C7075',
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  section: {
    gap: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2D3436',
    marginLeft: 10,
  },
  cardTitleSmall: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7F8C8D',
    marginBottom: 8,
  },
  cardValue: {
    fontSize: 16,
    color: '#1E1E1E',
    fontWeight: '500',
    lineHeight: 24,
  },
  cardValueSmall: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E1E1E',
  },
  input: {
    fontSize: 16,
    color: '#1E1E1E',
    fontWeight: '500',
    lineHeight: 24,
    backgroundColor: '#F5F6FA',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E1E5EB',
  },
  inputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputSmall: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E1E1E',
    backgroundColor: '#F5F6FA',
    padding: 8,
    borderRadius: 10,
  }
});

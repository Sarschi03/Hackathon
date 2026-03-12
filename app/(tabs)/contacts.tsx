import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, SafeAreaView, Pressable, TextInput, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Contact = { id: string; name: string; relation: string; phone: string; type: 'family' | 'doctor'; specialty?: string };

export default function ContactsScreen() {
  const [isEditing, setIsEditing] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([
    { id: '1', name: 'Mark Doe', relation: 'Husband', phone: '+1 (555) 123-4567', type: 'family' },
    { id: '2', name: 'Sarah Doe', relation: 'Daughter', phone: '+1 (555) 987-6543', type: 'family' },
    { id: '3', name: 'Dr. Robert Lewis', relation: 'Primary Care', specialty: 'General Practice', phone: '+1 (555) 555-0199', type: 'doctor' },
    { id: '4', name: 'Dr. Aisha Khan', relation: 'Specialist', specialty: 'Cardiology', phone: '+1 (555) 444-8899', type: 'doctor' },
  ]);

  const handleUpdate = (id: string, field: keyof Contact, value: string) => {
    setContacts(contacts.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const familyContacts = contacts.filter(c => c.type === 'family');
  const doctorContacts = contacts.filter(c => c.type === 'doctor');

  const ContactCard = ({ item }: { item: Contact }) => (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <View style={styles.avatar}>
          <Ionicons name={item.type === 'doctor' ? 'medkit' : 'person'} size={24} color="#4B7B4B" />
        </View>
        <View style={styles.infoCol}>
          {isEditing ? (
            <TextInput
              style={styles.inputName}
              value={item.name}
              onChangeText={(text) => handleUpdate(item.id, 'name', text)}
              placeholder="Name"
            />
          ) : (
            <Text style={styles.name}>{item.name}</Text>
          )}

          {isEditing ? (
            <TextInput
              style={styles.inputSub}
              value={item.type === 'doctor' ? item.specialty : item.relation}
              onChangeText={(text) => handleUpdate(item.id, item.type==='doctor' ? 'specialty' : 'relation', text)}
              placeholder="Role / Specialty"
            />
          ) : (
            <Text style={styles.relation}>{item.type === 'doctor' ? item.specialty : item.relation}</Text>
          )}

          {isEditing ? (
            <TextInput
              style={styles.inputPhone}
              value={item.phone}
              onChangeText={(text) => handleUpdate(item.id, 'phone', text)}
              placeholder="Phone Number"
              keyboardType="phone-pad"
            />
          ) : (
            <Text style={styles.phone}>{item.phone}</Text>
          )}
        </View>
      </View>
      
      {!isEditing && (
        <Pressable style={styles.callButton}>
          <Ionicons name="call" size={20} color="#FFFFFF" />
        </Pressable>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topNav}>
        <Text style={styles.navTitle}>Emergency Contacts</Text>
        <Pressable onPress={() => setIsEditing(!isEditing)} style={styles.editButton}>
          <Text style={styles.editButtonText}>{isEditing ? 'Done' : 'Edit'}</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        <View style={styles.sectionHeader}>
          <Ionicons name="shield-checkmark" size={24} color="#FF4B4B" />
          <Text style={styles.sectionTitle}>Family & Friends</Text>
        </View>
        
        {familyContacts.map(c => <ContactCard key={c.id} item={c} />)}

        <View style={[styles.sectionHeader, {marginTop: 20}]}>
          <Ionicons name="medical" size={24} color="#4B7B4B" />
          <Text style={styles.sectionTitle}>Medical Providers</Text>
        </View>
        
        {doctorContacts.map(c => <ContactCard key={c.id} item={c} />)}

        <View style={{height: 40}} />
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2D3436',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E8F8E3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  infoCol: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E1E1E',
    marginBottom: 2,
  },
  relation: {
    fontSize: 14,
    color: '#6C7075',
    fontWeight: '500',
    marginBottom: 2,
  },
  phone: {
    fontSize: 14,
    color: '#4B7B4B',
    fontWeight: '600',
  },
  callButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1E1E1E',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  inputName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E1E1E',
    backgroundColor: '#F5F6FA',
    padding: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 4,
  },
  inputSub: {
    fontSize: 14,
    color: '#6C7075',
    backgroundColor: '#F5F6FA',
    padding: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 4,
  },
  inputPhone: {
    fontSize: 14,
    color: '#4B7B4B',
    backgroundColor: '#F5F6FA',
    padding: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  }
});

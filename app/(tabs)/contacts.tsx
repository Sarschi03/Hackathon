import React, { useEffect, useState } from 'react';
import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAppSession } from '@/hooks/use-app-session';

type Contact = {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  type: 'family' | 'doctor';
  specialty?: string;
  canReceiveSms: boolean;
  canReceiveCall: boolean;
};

export default function ContactsScreen() {
  const { sessionToken } = useAppSession();
  const contactsFromDb = useQuery(
    api.contacts.listMyContacts,
    sessionToken ? { sessionToken } : 'skip',
  );
  const replaceContacts = useMutation(api.contacts.replaceMyContacts);
  const [isEditing, setIsEditing] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);

  useEffect(() => {
    if (!contactsFromDb) {
      return;
    }
    setContacts(
      contactsFromDb.map((contact: any) => ({
        id: String(contact._id),
        name: contact.name,
        relationship: contact.relationship,
        phone: contact.phone,
        type: contact.type,
        specialty: contact.specialty,
        canReceiveSms: contact.canReceiveSms,
        canReceiveCall: contact.canReceiveCall,
      })),
    );
  }, [contactsFromDb]);

  const handleUpdate = (id: string, field: keyof Contact, value: string) => {
    setContacts((current) => current.map((contact) => (contact.id === id ? { ...contact, [field]: value } : contact)));
  };

  const handleAddContact = (type: 'family' | 'doctor') => {
    setContacts((current) => [
      ...current,
      {
        id: `new_${Date.now()}`,
        name: '',
        relationship: type === 'doctor' ? 'Provider' : 'Relationship',
        phone: '',
        specialty: type === 'doctor' ? 'Specialty' : undefined,
        type,
        canReceiveSms: true,
        canReceiveCall: true,
      },
    ]);
  };

  const handleSave = async () => {
    if (!sessionToken) {
      return;
    }
    try {
      await replaceContacts({
        sessionToken,
        contacts: contacts.map((contact, index) => ({
          name: contact.name,
          relationship: contact.relationship,
          phone: contact.phone,
          type: contact.type,
          specialty: contact.specialty,
          priority: index + 1,
          canReceiveSms: contact.canReceiveSms,
          canReceiveCall: contact.canReceiveCall,
        })),
      });
      setIsEditing(false);
    } catch (error) {
      Alert.alert('Contacts save failed', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  const familyContacts = contacts.filter((contact) => contact.type === 'family');
  const doctorContacts = contacts.filter((contact) => contact.type === 'doctor');

  const ContactCard = ({ item }: { item: Contact }) => (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <View style={styles.avatar}>
          <Ionicons name={item.type === 'doctor' ? 'medkit' : 'person'} size={24} color="#4B7B4B" />
        </View>
        <View style={styles.infoCol}>
          {isEditing ? (
            <TextInput style={styles.inputName} value={item.name} onChangeText={(text) => handleUpdate(item.id, 'name', text)} placeholder="Name" />
          ) : (
            <Text style={styles.name}>{item.name || 'Unnamed contact'}</Text>
          )}

          {isEditing ? (
            <TextInput
              style={styles.inputSub}
              value={item.type === 'doctor' ? item.specialty : item.relationship}
              onChangeText={(text) => handleUpdate(item.id, item.type === 'doctor' ? 'specialty' : 'relationship', text)}
              placeholder="Role / Specialty"
            />
          ) : (
            <Text style={styles.relation}>{item.type === 'doctor' ? item.specialty : item.relationship}</Text>
          )}

          {isEditing ? (
            <TextInput style={styles.inputPhone} value={item.phone} onChangeText={(text) => handleUpdate(item.id, 'phone', text)} placeholder="Phone Number" keyboardType="phone-pad" />
          ) : (
            <Text style={styles.phone}>{item.phone || 'No phone added'}</Text>
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
        <Pressable onPress={() => (isEditing ? void handleSave() : setIsEditing(true))} style={styles.editButton}>
          <Text style={styles.editButtonText}>{isEditing ? 'Save' : 'Edit'}</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.sectionHeader}>
          <Ionicons name="shield-checkmark" size={24} color="#FF4B4B" />
          <Text style={styles.sectionTitle}>Family & Friends</Text>
        </View>

        {familyContacts.map((contact) => <ContactCard key={contact.id} item={contact} />)}
        {isEditing ? (
          <Pressable style={styles.addButton} onPress={() => handleAddContact('family')}>
            <Text style={styles.addButtonText}>Add family contact</Text>
          </Pressable>
        ) : null}

        <View style={[styles.sectionHeader, { marginTop: 20 }]}>
          <Ionicons name="medical" size={24} color="#4B7B4B" />
          <Text style={styles.sectionTitle}>Medical Providers</Text>
        </View>

        {doctorContacts.map((contact) => <ContactCard key={contact.id} item={contact} />)}
        {isEditing ? (
          <Pressable style={styles.addButton} onPress={() => handleAddContact('doctor')}>
            <Text style={styles.addButtonText}>Add medical provider</Text>
          </Pressable>
        ) : null}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F7F8FA' },
  topNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 10, backgroundColor: '#F7F8FA' },
  navTitle: { fontSize: 24, fontWeight: '800', color: '#1E1E1E' },
  editButton: { backgroundColor: '#E8F8E3', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  editButtonText: { color: '#4B7B4B', fontWeight: '700', fontSize: 14 },
  container: { padding: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 10 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#2D3436' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#F0F0F0' },
  cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#E8F8E3', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  infoCol: { flex: 1, justifyContent: 'center' },
  name: { fontSize: 18, fontWeight: '700', color: '#1E1E1E', marginBottom: 2 },
  relation: { fontSize: 14, color: '#6C7075', fontWeight: '500', marginBottom: 2 },
  phone: { fontSize: 14, color: '#4B7B4B', fontWeight: '600' },
  callButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#1E1E1E', alignItems: 'center', justifyContent: 'center', marginLeft: 10 },
  inputName: { fontSize: 18, fontWeight: '700', color: '#1E1E1E', backgroundColor: '#F5F6FA', padding: 4, paddingHorizontal: 8, borderRadius: 8, marginBottom: 4 },
  inputSub: { fontSize: 14, color: '#6C7075', backgroundColor: '#F5F6FA', padding: 4, paddingHorizontal: 8, borderRadius: 8, marginBottom: 4 },
  inputPhone: { fontSize: 14, color: '#4B7B4B', backgroundColor: '#F5F6FA', padding: 4, paddingHorizontal: 8, borderRadius: 8 },
  addButton: { backgroundColor: '#FFFFFF', borderRadius: 16, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: '#DCE3EA', marginBottom: 8 },
  addButtonText: { fontWeight: '700', color: '#1E1E1E' },
});

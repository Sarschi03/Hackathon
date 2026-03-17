import { useLocalization } from '@/hooks/use-localization';
import { api } from '@/convex/_generated/api';
import { useAppSession } from '@/hooks/use-app-session';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery } from 'convex/react';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

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
  const { t } = useLocalization();
  const { sessionToken } = useAppSession();
  const contactsFromDb = useQuery(
    api.contacts.listMyContacts,
    sessionToken ? { sessionToken } : 'skip',
  );
  const replaceContacts = useMutation(api.contacts.replaceMyContacts);
  const [isEditing, setIsEditing] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);

  const RELATIONSHIP_OPTIONS = ['spouse', 'sibling', 'child', 'extended'];

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
          <Ionicons name={item.type === 'doctor' ? 'medkit' : 'person'} size={24} color="#4BAEE8" />
        </View>
        <View style={styles.infoCol}>
          {isEditing ? (
            <TextInput style={styles.inputName} value={item.name} onChangeText={(text) => handleUpdate(item.id, 'name', text)} placeholder="Name" />
          ) : (
            <Text style={styles.name}>{item.name || 'Unnamed contact'}</Text>
          )}

          {isEditing ? (
            item.type === 'doctor' ? (
              <TextInput
                style={styles.inputSub}
                value={item.specialty}
                onChangeText={(text) => handleUpdate(item.id, 'specialty', text)}
                placeholder="Specialty"
              />
            ) : (
              <Pressable
                style={styles.dropdownTrigger}
                onPress={() => {
                  setEditingContactId(item.id);
                  setDropdownVisible(true);
                }}
              >
                <Text style={styles.dropdownTriggerText}>{item.relationship || 'Select Relationship'}</Text>
                <Ionicons name="chevron-down" size={12} color="#64748B" />
              </Pressable>
            )
          ) : (
            <Text style={styles.relation}>
              {item.type === 'doctor' ? item.specialty : (RELATIONSHIP_OPTIONS.includes(item.relationship) ? t(item.relationship as any) : item.relationship)}
            </Text>
          )}

          {isEditing ? (
            <TextInput style={styles.inputPhone} value={item.phone} onChangeText={(text) => handleUpdate(item.id, 'phone', text)} placeholder="Phone Number" keyboardType="phone-pad" />
          ) : (
            <Text style={styles.phone}>{item.phone || 'Enter phone...'}</Text>
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
        <Text style={styles.navTitle}>Contacts</Text>
        <Pressable onPress={() => (isEditing ? void handleSave() : setIsEditing(true))} style={styles.editButton}>
          <Text style={styles.editButtonText}>{isEditing ? t('btn_save') : t('btn_edit')}</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.sectionHeader}>
          <Ionicons name="shield-checkmark" size={20} color="#FF4B4B" />
          <Text style={styles.sectionTitle}>{t('contacts_family')}</Text>
        </View>

        {familyContacts.map((contact) => <ContactCard key={contact.id} item={contact} />)}
        <Pressable 
          style={styles.addButton} 
          onPress={() => {
            handleAddContact('family');
            if (!isEditing) setIsEditing(true);
          }}
        >
          <Text style={styles.addButtonText}>{t('contacts_add_family')}</Text>
        </Pressable>

        <View style={[styles.sectionHeader, { marginTop: 24 }]}>
          <Ionicons name="medical" size={20} color="#4BAEE8" />
          <Text style={styles.sectionTitle}>{t('contacts_medical')}</Text>
        </View>

        {doctorContacts.map((contact) => <ContactCard key={contact.id} item={contact} />)}
        <Pressable 
          style={styles.addButton} 
          onPress={() => {
            handleAddContact('doctor');
            if (!isEditing) setIsEditing(true);
          }}
        >
          <Text style={styles.addButtonText}>{t('contacts_add_medical')}</Text>
        </Pressable>

        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={dropdownVisible} transparent animationType="fade" onRequestClose={() => setDropdownVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setDropdownVisible(false)}>
          <View style={styles.dropdownMenu}>
            <Text style={styles.dropdownTitle}>Select Relationship</Text>
            {RELATIONSHIP_OPTIONS.map((option) => (
              <Pressable
                key={option}
                style={styles.dropdownItem}
                onPress={() => {
                  if (editingContactId) {
                    handleUpdate(editingContactId, 'relationship', option);
                  }
                  setDropdownVisible(false);
                }}
              >
                <Text style={styles.dropdownItemText}>{t(option as any)}</Text>
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
  topNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16, backgroundColor: '#F2F3F5' },
  navTitle: { fontSize: 18, fontWeight: '700', color: '#1A1C22', letterSpacing: 0.3, fontFamily: 'InterBold' },
  editButton: { backgroundColor: 'rgba(0,0,0,0.05)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  editButtonText: { color: '#4B5563', fontWeight: '700', fontSize: 13, fontFamily: 'InterSemiBold' },
  container: { padding: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1A1C22', fontFamily: 'InterBold' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 10, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 1 },
  cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(75, 174, 232, 0.1)', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  infoCol: { flex: 1, justifyContent: 'center' },
  name: { fontSize: 16, fontWeight: '700', color: '#1A1C22', marginBottom: 2, fontFamily: 'InterBold' },
  relation: { fontSize: 13, color: '#64748B', fontWeight: '500', marginBottom: 2, fontFamily: 'Inter' },
  phone: { fontSize: 13, color: '#4BAEE8', fontWeight: '600', fontFamily: 'InterSemiBold' },
  callButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1A1C22', alignItems: 'center', justifyContent: 'center', marginLeft: 10 },
  inputName: { fontSize: 16, fontWeight: '700', color: '#1A1C22', backgroundColor: '#F9FAFB', padding: 4, paddingHorizontal: 8, borderRadius: 8, marginBottom: 4, fontFamily: 'InterBold' },
  inputSub: { fontSize: 13, color: '#64748B', backgroundColor: '#F9FAFB', padding: 4, paddingHorizontal: 8, borderRadius: 8, marginBottom: 4, fontFamily: 'Inter' },
  inputPhone: { fontSize: 13, color: '#4BAEE8', backgroundColor: '#F9FAFB', padding: 4, paddingHorizontal: 8, borderRadius: 8, fontFamily: 'InterSemiBold' },
  addButton: { backgroundColor: '#FFFFFF', borderRadius: 10, paddingVertical: 14, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 1, marginBottom: 16 },
  addButtonText: { fontWeight: '700', color: '#1A1C22', fontSize: 14, fontFamily: 'InterBold' },

  // Dropdown
  dropdownTrigger: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', padding: 4, paddingHorizontal: 8, borderRadius: 8, marginBottom: 4, gap: 4 },
  dropdownTriggerText: { fontSize: 13, color: '#64748B', fontFamily: 'Inter' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  dropdownMenu: { width: '80%', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 5 },
  dropdownTitle: { fontSize: 16, fontWeight: '700', color: '#1A1C22', marginBottom: 16, textAlign: 'center', fontFamily: 'InterBold' },
  dropdownItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  dropdownItemText: { fontSize: 15, color: '#4B5563', textAlign: 'center', fontFamily: 'Inter' },
});

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

type ContactCardProps = {
  item: Contact;
  isEditing: boolean;
  handleUpdate: (id: string, field: keyof Contact, value: string) => void;
  handleDelete: (id: string) => void;
  setEditingContactId: (id: string) => void;
  setDropdownVisible: (visible: boolean) => void;
  t: any;
  relationshipOptions: string[];
};

const ContactCard = ({
  item,
  isEditing,
  handleUpdate,
  handleDelete,
  setEditingContactId,
  setDropdownVisible,
  t,
  relationshipOptions,
}: ContactCardProps) => (
  <View style={styles.card}>
    <View style={styles.cardLeft}>
      <View style={styles.infoCol}>
        {isEditing ? (
          <TextInput
            style={styles.inputName}
            value={item.name}
            onChangeText={(text) => handleUpdate(item.id, 'name', text)}
            placeholder="Name"
          />
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
            {item.type === 'doctor'
              ? item.specialty
              : relationshipOptions.includes(item.relationship)
                ? t(item.relationship as any)
                : item.relationship}
          </Text>
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
          <Text style={styles.phone}>{item.phone || 'Enter phone...'}</Text>
        )}
      </View>
    </View>

    {isEditing ? (
      <Pressable style={styles.deleteButton} onPress={() => handleDelete(item.id)}>
        <Ionicons name="trash-outline" size={20} color="#FF4B4B" />
      </Pressable>
    ) : (
      <Pressable style={styles.callButton}>
        <Text style={styles.callButtonText}>CALL</Text>
      </Pressable>
    )}
  </View>
);

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

  const handleDelete = (id: string) => {
    setContacts((current) => current.filter((contact) => contact.id !== id));
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


  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topNav}>
        <View />
        <Pressable onPress={() => (isEditing ? void handleSave() : setIsEditing(true))} style={styles.editButton}>
          <Text style={styles.editButtonText}>{isEditing ? t('btn_save') : t('btn_edit')}</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('contacts_family')}</Text>
        </View>

        {familyContacts.map((contact) => (
          <ContactCard
            key={contact.id}
            item={contact}
            isEditing={isEditing}
            handleUpdate={handleUpdate}
            handleDelete={handleDelete}
            setEditingContactId={setEditingContactId}
            setDropdownVisible={setDropdownVisible}
            t={t}
            relationshipOptions={RELATIONSHIP_OPTIONS}
          />
        ))}
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
          <Text style={styles.sectionTitle}>{t('contacts_medical')}</Text>
        </View>

        {doctorContacts.map((contact) => (
          <ContactCard
            key={contact.id}
            item={contact}
            isEditing={isEditing}
            handleUpdate={handleUpdate}
            handleDelete={handleDelete}
            setEditingContactId={setEditingContactId}
            setDropdownVisible={setDropdownVisible}
            t={t}
            relationshipOptions={RELATIONSHIP_OPTIONS}
          />
        ))}
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
  topNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 40, paddingBottom: 16, backgroundColor: '#F2F3F5' },
  navTitle: { fontSize: 18, fontWeight: '700', color: '#1A1C22', letterSpacing: 0.3, fontFamily: 'InterBold' },
  editButton: { 
    padding: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 24,
    minHeight: 48,
    minWidth: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
    fontFamily: 'InterBold',
  },
  container: { padding: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1A1C22', fontFamily: 'InterBold' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.05, shadowRadius: 16, elevation: 3 },
  cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  infoCol: { flex: 1, justifyContent: 'center' },
  name: { fontSize: 18, fontWeight: '600', color: '#1A1C22', marginBottom: 4, fontFamily: 'InterSemiBold' },
  relation: { fontSize: 15, color: '#666666', fontWeight: '500', marginBottom: 4, fontFamily: 'InterMedium' },
  phone: { fontSize: 15, color: '#4BAEE8', fontWeight: '500', fontFamily: 'InterMedium' },
  callButton: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, backgroundColor: '#1A1C22', alignItems: 'center', justifyContent: 'center', marginLeft: 10 },
  deleteButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFF5F5', alignItems: 'center', justifyContent: 'center', marginLeft: 10 },
  callButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 12, fontFamily: 'InterBold' },
  inputName: { fontSize: 18, fontWeight: '600', color: '#1A1C22', backgroundColor: '#F9FAFB', padding: 12, borderRadius: 12, marginBottom: 8, fontFamily: 'InterSemiBold' },
  inputSub: { fontSize: 15, color: '#666666', backgroundColor: '#F9FAFB', padding: 10, borderRadius: 12, marginBottom: 8, fontFamily: 'InterMedium' },
  inputPhone: { fontSize: 15, color: '#4BAEE8', backgroundColor: '#F9FAFB', padding: 10, borderRadius: 12, fontFamily: 'InterMedium' },
  addButton: { backgroundColor: '#FFFFFF', borderRadius: 24, paddingVertical: 14, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.05, shadowRadius: 16, elevation: 3, marginBottom: 16 },
  addButtonText: { fontWeight: '700', color: '#1A1C22', fontSize: 14, fontFamily: 'InterBold' },

  // Dropdown
  dropdownTrigger: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', padding: 10, paddingHorizontal: 12, borderRadius: 12, marginBottom: 8, gap: 4 },
  dropdownTriggerText: { fontSize: 13, color: '#64748B', fontFamily: 'Inter' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  dropdownMenu: { width: '80%', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 5 },
  dropdownTitle: { fontSize: 16, fontWeight: '700', color: '#1A1C22', marginBottom: 16, textAlign: 'center', fontFamily: 'InterBold' },
  dropdownItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  dropdownItemText: { fontSize: 15, color: '#4B5563', textAlign: 'center', fontFamily: 'Inter' },
});

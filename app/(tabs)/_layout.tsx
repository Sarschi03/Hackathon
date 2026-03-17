import { Tabs } from 'expo-router';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useAppSession } from '@/hooks/use-app-session';

export default function TabLayout() {
  const { currentRole } = useAppSession();
  const isResponder = currentRole === 'responder';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#1E1E1E',
        tabBarInactiveTintColor: '#BDC3C7',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          elevation: 10,
          shadowColor: '#000',
          shadowOpacity: 0.05,
          shadowRadius: 10,
          height: 75,
          paddingBottom: 15,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        }
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: isResponder ? 'Dispatch' : 'Home',
          tabBarIcon: ({ color }) => (
            <Ionicons name={isResponder ? 'radio' : 'home'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="medical"
        options={{
          href: isResponder ? null : undefined,
          title: 'Medical',
          tabBarIcon: ({ color }) => <Ionicons name="medical" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="contacts"
        options={{
          href: isResponder ? null : undefined,
          title: 'Contacts',
          tabBarIcon: ({ color }) => <Ionicons name="people" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}

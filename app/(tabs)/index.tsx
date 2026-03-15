import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useMutation, useQuery } from 'convex/react';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { api } from '@/convex/_generated/api';
import { useAppSession } from '@/hooks/use-app-session';

const FALLBACK_LOCATION = {
  latitude: 47.3769,
  longitude: 8.5417,
};

const EkgLine = () => (
  <View style={styles.ekgContainer}>
    <View style={styles.pulseLine1} />
    <View style={styles.pulseLine2} />
    <View style={styles.pulseLine3} />
    <View style={styles.pulseLine4} />
    <View style={styles.pulseLine5} />
    <View style={styles.pulseLine6} />
  </View>
);

async function getCurrentCoordinates() {
  const permission = await Location.requestForegroundPermissionsAsync();
  if (permission.status !== 'granted') {
    return FALLBACK_LOCATION;
  }

  const position = await Location.getCurrentPositionAsync({});
  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracy: position.coords.accuracy ?? undefined,
  };
}

export default function HomeScreen() {
  const { sessionToken, isReady, viewer } = useAppSession();
  const activeIncident = useQuery(
    api.incidents.getActiveIncidentForViewer,
    sessionToken ? { sessionToken } : 'skip',
  );
  const responderProfile = useQuery(
    api.responders.getMyResponderProfile,
    sessionToken ? { sessionToken } : 'skip',
  );
  const incomingAlerts = useQuery(
    api.responders.listMyIncomingAlerts,
    sessionToken ? { sessionToken } : 'skip',
  );
  const createIncident = useMutation(api.incidents.createIncident);
  const cancelIncident = useMutation(api.incidents.cancelIncident);
  const updateMyLocation = useMutation(api.locations.updateMyLocation);
  const setAvailability = useMutation(api.responders.setAvailability);
  const acceptAlert = useMutation(api.responders.acceptAlert);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const firstName = useMemo(() => {
    const fullName = viewer?.user?.fullName ?? 'Friend';
    return fullName.split(' ')[0];
  }, [viewer?.user?.fullName]);

  const handleSosPress = async () => {
    if (!sessionToken) {
      return;
    }

    setIsSubmitting(true);
    try {
      if (activeIncident?.incident) {
        await cancelIncident({
          sessionToken,
          incidentId: activeIncident.incident._id,
          reason: 'Cancelled from home screen',
        });
      } else {
        const coords = await getCurrentCoordinates();
        await updateMyLocation({
          sessionToken,
          lat: coords.latitude,
          lng: coords.longitude,
          accuracyMeters: 'accuracy' in coords ? coords.accuracy : undefined,
          source: 'incident',
        });
        await createIncident({
          sessionToken,
          triggerType: 'manual',
          lat: coords.latitude,
          lng: coords.longitude,
          addressText: 'Live device location',
          notes: 'Triggered from mobile SOS button',
        });
      }
    } catch (error) {
      Alert.alert('Emergency action failed', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleAvailability = async () => {
    if (!sessionToken || !responderProfile) {
      return;
    }
    try {
      const coords = await getCurrentCoordinates();
      await updateMyLocation({
        sessionToken,
        lat: coords.latitude,
        lng: coords.longitude,
        accuracyMeters: 'accuracy' in coords ? coords.accuracy : undefined,
        source: 'foreground',
      });
      await setAvailability({
        sessionToken,
        isAvailable: !responderProfile.isAvailable,
      });
    } catch (error) {
      Alert.alert('Responder status failed', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  const handleAcceptAlert = async (alertId: string) => {
    if (!sessionToken) {
      return;
    }
    try {
      await acceptAlert({ sessionToken, alertId: alertId as never });
    } catch (error) {
      Alert.alert('Alert acceptance failed', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  if (!isReady || !viewer) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.sosContainer}>
          <Pressable
            style={[styles.sosButton, activeIncident?.incident && styles.sosButtonActive]}
            onPress={() => void handleSosPress()}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.sosText}>{activeIncident?.incident ? 'CANCEL SOS' : 'SOS!'}</Text>
                <Text style={styles.sosSubtext}>
                  {activeIncident?.incident
                    ? `Status: ${activeIncident.incident.status.replaceAll('_', ' ')}`
                    : 'Tap to trigger the yellow-alert confirmation flow'}
                </Text>
              </>
            )}
          </Pressable>
        </View>

        {activeIncident?.incident ? (
          <View style={styles.statusCard}>
            <Text style={styles.statusTitle}>Live incident</Text>
            <Text style={styles.statusLine}>Severity: {activeIncident.incident.severity.toUpperCase()}</Text>
            <Text style={styles.statusLine}>Stage: {activeIncident.incident.status.replaceAll('_', ' ')}</Text>
            <Text style={styles.statusHint}>
              {activeIncident.timeline.at(-1)?.message ?? 'Waiting for the next incident event.'}
            </Text>
          </View>
        ) : null}

        {responderProfile ? (
          <View style={styles.statusCard}>
            <Text style={styles.statusTitle}>Responder mode</Text>
            <Text style={styles.statusLine}>Verification: {responderProfile.verificationStatus}</Text>
            <Text style={styles.statusHint}>
              {responderProfile.verificationStatus === 'verified'
                ? 'You can receive ETA-ranked alerts when availability is on.'
                : 'Manual verification is still required before alerts can reach you.'}
            </Text>
            <Pressable style={styles.availabilityButton} onPress={() => void handleToggleAvailability()}>
              <Text style={styles.availabilityButtonText}>
                {responderProfile.isAvailable ? 'Set Unavailable' : 'Set Available'}
              </Text>
            </Pressable>
          </View>
        ) : null}

        {incomingAlerts && incomingAlerts.length > 0 ? (
          <View style={styles.alertsSection}>
            <Text style={styles.sectionTitle}>Incoming responder alerts</Text>
            {incomingAlerts.map((alert: any) => (
              <View key={alert._id} style={styles.alertCard}>
                <Text style={styles.alertTitle}>{Math.round(alert.estimatedTravelSeconds / 60)} min ETA</Text>
                <Text style={styles.alertBody}>Patient blood group: {alert.medicalSummary?.bloodGroup || 'Unknown'}</Text>
                <Text style={styles.alertBody}>Allergies: {alert.medicalSummary?.allergies || 'None listed'}</Text>
                <Pressable style={styles.acceptButton} onPress={() => void handleAcceptAlert(String(alert._id))}>
                  <Text style={styles.acceptButtonText}>Accept alert</Text>
                </Pressable>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.greetingContainer}>
          <Text style={styles.greetingText}>{firstName},</Text>
          <Text style={styles.greetingTitle}>Check{`\n`}your Vitals!</Text>
        </View>

        <View style={styles.heartRateCard}>
          <View style={styles.cardHeader}>
            <View style={styles.iconCircle}>
              <Ionicons name="pulse" size={20} color="#000" />
            </View>
            <Text style={styles.vitalLabel}>Heart rate</Text>
          </View>
          <EkgLine />
        </View>

        <View style={styles.vitalsGrid}>
          <View style={styles.smallCard}>
            <View style={styles.smallCardHeader}>
              <View style={styles.iconCircle}>
                <Ionicons name="water" size={16} color="#000" />
              </View>
            </View>
            <Text style={styles.vitalLabel}>Blood oxygen</Text>
            <View style={styles.valueRow}>
              <Text style={styles.vitalValue}>98</Text>
              <Text style={styles.vitalUnit}>SpO2%</Text>
            </View>
          </View>

          <View style={styles.smallCard}>
            <View style={styles.smallCardHeader}>
              <View style={styles.iconCircle}>
                <Ionicons name="fitness-outline" size={16} color="#000" />
              </View>
            </View>
            <Text style={styles.vitalLabel}>Respiratory rate</Text>
            <View style={styles.valueRow}>
              <Text style={styles.vitalValue}>16</Text>
              <Text style={styles.vitalUnit}>br/min</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingScreen: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  safeArea: { flex: 1, backgroundColor: '#F2F2F6' },
  container: { padding: 24, paddingTop: 40 },
  sosContainer: { justifyContent: 'center', alignItems: 'center', marginBottom: 24, width: '100%' },
  sosButton: {
    width: '100%',
    height: 140,
    borderRadius: 36,
    backgroundColor: '#FF8A8A',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF8A8A',
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  sosButtonActive: { backgroundColor: '#FF7070' },
  sosText: { fontSize: 40, fontWeight: '700', color: '#FFFFFF', letterSpacing: -1 },
  sosSubtext: { fontSize: 14, fontWeight: '500', color: 'rgba(255,255,255,0.88)', marginTop: 8, textAlign: 'center', paddingHorizontal: 24 },
  statusCard: { backgroundColor: '#FFFFFF', borderRadius: 28, padding: 20, marginBottom: 16 },
  statusTitle: { fontSize: 18, fontWeight: '700', color: '#111111', marginBottom: 8 },
  statusLine: { fontSize: 14, color: '#394150', marginBottom: 4 },
  statusHint: { fontSize: 13, lineHeight: 20, color: '#6B7280', marginTop: 6 },
  availabilityButton: { marginTop: 14, backgroundColor: '#111111', borderRadius: 20, paddingVertical: 12, alignItems: 'center' },
  availabilityButtonText: { color: '#FFFFFF', fontWeight: '700' },
  alertsSection: { marginBottom: 18 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111111', marginBottom: 10 },
  alertCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 18, marginBottom: 12 },
  alertTitle: { fontSize: 18, fontWeight: '700', color: '#111111', marginBottom: 8 },
  alertBody: { fontSize: 13, color: '#4B5563', marginBottom: 4 },
  acceptButton: { marginTop: 12, alignSelf: 'flex-start', backgroundColor: '#2E7D32', borderRadius: 18, paddingHorizontal: 16, paddingVertical: 10 },
  acceptButtonText: { color: '#FFFFFF', fontWeight: '700' },
  greetingContainer: { marginBottom: 24, paddingLeft: 4 },
  greetingText: { fontSize: 20, fontWeight: '500', color: '#8E8E93', marginBottom: 4 },
  greetingTitle: { fontSize: 32, fontWeight: '400', color: '#000000', lineHeight: 38, letterSpacing: -1 },
  iconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0, 0, 0, 0.03)', alignItems: 'center', justifyContent: 'center' },
  heartRateCard: { backgroundColor: '#FFFFFF', borderRadius: 36, padding: 24, marginBottom: 16, minHeight: 160 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  vitalLabel: { fontSize: 18, fontWeight: '600', color: '#000' },
  vitalValue: { fontSize: 32, fontWeight: '600', color: '#000', letterSpacing: -1 },
  vitalUnit: { fontSize: 14, fontWeight: '500', color: '#8E8E93', marginBottom: 4 },
  ekgContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 60, marginTop: 20, paddingHorizontal: 10, overflow: 'hidden' },
  pulseLine1: { width: 40, height: 4, backgroundColor: '#000', borderRadius: 2 },
  pulseLine2: { width: 25, height: 4, backgroundColor: '#000', transform: [{ rotate: '-50deg' }], marginLeft: -6, marginTop: -12, borderRadius: 2 },
  pulseLine3: { width: 35, height: 4, backgroundColor: '#000', transform: [{ rotate: '65deg' }], marginLeft: -10, marginTop: 12, borderRadius: 2 },
  pulseLine4: { width: 35, height: 4, backgroundColor: '#000', transform: [{ rotate: '-65deg' }], marginLeft: -12, marginTop: -12, borderRadius: 2 },
  pulseLine5: { width: 25, height: 4, backgroundColor: '#000', transform: [{ rotate: '50deg' }], marginLeft: -10, marginTop: 10, borderRadius: 2 },
  pulseLine6: { flex: 1, height: 4, backgroundColor: '#000', marginLeft: -6, borderRadius: 2 },
  vitalsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, justifyContent: 'space-between' },
  smallCard: { width: '47.5%', backgroundColor: '#FFFFFF', borderRadius: 36, padding: 20, minHeight: 140, justifyContent: 'space-between' },
  smallCardHeader: { marginBottom: 16 },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 8 },
});

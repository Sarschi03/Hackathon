import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

type VitalCardProps = {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  bgColor: string;
  label: string;
  value: string;
  unit: string;
  status: string;
  statusColor: string;
};

function VitalCard({ icon, iconColor, bgColor, label, value, unit, status, statusColor }: VitalCardProps) {
  return (
    <View style={[styles.vitalCard, { backgroundColor: bgColor }]}>
      <View style={styles.vitalCardHeader}>
        <View style={[styles.vitalIconCircle, { backgroundColor: 'rgba(255,255,255,0.65)' }]}>
          <Ionicons name={icon} size={20} color={iconColor} />
        </View>
        <View style={[styles.statusPill, { backgroundColor: statusColor + '22' }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>{status}</Text>
        </View>
      </View>
      <Text style={styles.vitalLabel}>{label}</Text>
      <View style={styles.vitalValueRow}>
        <Text style={styles.vitalValue}>{value}</Text>
        <Text style={styles.vitalUnit}>{unit}</Text>
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const [sosActive, setSosActive] = useState(false);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Huge SOS Button */}
        <View style={styles.sosContainer}>
          <Pressable
            style={[styles.sosButton, sosActive && styles.sosButtonActive]}
            onPress={() => setSosActive(!sosActive)}
            onLongPress={() => alert('Emergency Services Contacted!')}
          >
            <Text style={styles.sosText}>{sosActive ? 'CANCEL SOS' : 'SOS'}</Text>
            {!sosActive && <Text style={styles.sosSubtext}>HOLD TO ACTIVATE</Text>}
          </Pressable>
        </View>

        {/* Vitals Section Title */}
        <Text style={styles.sectionTitle}>Live Vitals</Text>

        {/* Vitals Grid: 2x2 */}
        <View style={styles.vitalsGrid}>
          <VitalCard
            icon="pulse"
            iconColor="#E84393"
            bgColor="#FFF0F6"
            label="Heart Rate"
            value="86"
            unit="bpm"
            status="Normal"
            statusColor="#E84393"
          />
          <VitalCard
            icon="water"
            iconColor="#3D9EF5"
            bgColor="#EEF6FF"
            label="Blood Oxygen"
            value="98"
            unit="SpO₂ %"
            status="Normal"
            statusColor="#3D9EF5"
          />
          <VitalCard
            icon="fitness-outline"
            iconColor="#7C5CBF"
            bgColor="#F3EEFF"
            label="Respiratory Rate"
            value="16"
            unit="br/min"
            status="Normal"
            statusColor="#7C5CBF"
          />
          <VitalCard
            icon="thermometer"
            iconColor="#E8782A"
            bgColor="#FFF4EC"
            label="Blood Pressure"
            value="118/76"
            unit="mmHg"
            status="Normal"
            statusColor="#E8782A"
          />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  container: {
    padding: 24,
    paddingTop: 40,
  },

  sosContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 36,
  },
  sosButton: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#FF4B4B',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF4B4B',
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 15,
    borderWidth: 6,
    borderColor: '#FFD6D6',
  },
  sosButtonActive: {
    backgroundColor: '#E74C3C',
    borderColor: '#FF6B6B',
    transform: [{ scale: 0.95 }],
    shadowOpacity: 0.8,
  },
  sosText: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  sosSubtext: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFEAEA',
    marginTop: 8,
    letterSpacing: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E1E1E',
    marginBottom: 16,
  },
  vitalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  vitalCard: {
    width: '47%',
    borderRadius: 22,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  vitalCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  vitalIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  vitalLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6C7075',
    marginBottom: 6,
  },
  vitalValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  vitalValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1E1E1E',
  },
  vitalUnit: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9B9EA3',
    marginBottom: 2,
  },
});

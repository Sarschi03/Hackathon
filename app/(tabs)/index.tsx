import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

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

export default function HomeScreen() {
  const [sosActive, setSosActive] = useState(false);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* Subtle SOS Button */}
        <View style={styles.sosContainer}>
          <Pressable
            style={[styles.sosButton, sosActive && styles.sosButtonActive]}
            onPress={() => setSosActive(!sosActive)}
            onLongPress={() => alert('Emergency Services Contacted!')}
          >
            <Text style={styles.sosText}>{sosActive ? 'CANCEL SOS' : 'SOS!'}</Text>
            {!sosActive && <Text style={styles.sosSubtext}>Hold to activate!</Text>}
          </Pressable>
        </View>

        {/* Greeting text */}
        <View style={styles.greetingContainer}>
          <Text style={styles.greetingText}>James,</Text>
          <Text style={styles.greetingTitle}>Check{"\n"}your Vitals!</Text>
        </View>

        {/* Heart Rate Big Box */}
        <View style={styles.heartRateCard}>
          <View style={styles.cardHeader}>
            <View style={styles.iconCircle}>
              <Ionicons name="pulse" size={20} color="#000" />
            </View>
            <Text style={styles.vitalLabel}>Heart rate</Text>
          </View>
          <EkgLine />
        </View>

        {/* Vitals Grid: 2x2 */}
        <View style={styles.vitalsGrid}>
          {/* Blood oxygen */}
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

          {/* Respiratory rate */}
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

          {/* Blood Pressure */}
          <View style={styles.smallCard}>
            <View style={styles.smallCardHeader}>
              <View style={styles.iconCircle}>
                <Ionicons name="thermometer" size={16} color="#000" />
              </View>
            </View>
            <Text style={styles.vitalLabel}>Blood Pressure</Text>
            <View style={styles.valueRow}>
              <Text style={styles.vitalValue}>118/70</Text>
              <Text style={styles.vitalUnit}>mmHg</Text>
            </View>
          </View>

          {/* Empty Match to the Grid */}
          <View style={styles.smallCardEmpty} />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F2F2F6', // Lighter, cooler gray like the reference app
  },
  container: {
    padding: 24,
    paddingTop: 40,
  },

  // SOS Button - Now a wide rounded rectangle, less red
  sosContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    width: '100%',
  },
  sosButton: {
    width: '100%',
    height: 140, // rectangular shape, matches card width
    borderRadius: 36, // very heavily rounded like the cards in reference
    backgroundColor: '#FF8A8A', // much less red
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF8A8A',
    shadowOpacity: 0.25, // radiating light
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  sosButtonActive: {
    backgroundColor: '#FF7070',
    transform: [{ scale: 0.96 }],
    shadowOpacity: 0.4,
  },
  sosText: {
    fontSize: 44,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  sosSubtext: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },

  // Greeting - Clean and Large
  greetingContainer: {
    marginBottom: 32,
    paddingLeft: 4,
  },
  greetingText: {
    fontSize: 20,
    fontWeight: '500',
    color: '#8E8E93',
    marginBottom: 4,
  },
  greetingTitle: {
    fontSize: 32, // made a bit smaller
    fontWeight: '400', // matches reference look
    color: '#000000',
    lineHeight: 38,
    letterSpacing: -1,
  },

  // Icon Circle Base - glass look
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Heart Rate Card - fixed text visibility by adding background color
  heartRateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 36,
    padding: 24,
    marginBottom: 16,
    minHeight: 160,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 2,
    shadowOffset: { width: 0, height: 8 },
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  // Typography for Cards
  vitalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  vitalValue: {
    fontSize: 32,
    fontWeight: '600',
    color: '#000',
    letterSpacing: -1,
  },
  vitalUnit: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
    marginBottom: 4,
  },

  // EKG Line CSS trick
  ekgContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
    marginTop: 20,
    paddingHorizontal: 10,
    overflow: 'hidden',
  },
  pulseLine1: { width: 40, height: 4, backgroundColor: '#000', borderRadius: 2 },
  pulseLine2: { width: 25, height: 4, backgroundColor: '#000', transform: [{ rotate: '-50deg' }], marginLeft: -6, marginTop: -12, borderRadius: 2 },
  pulseLine3: { width: 35, height: 4, backgroundColor: '#000', transform: [{ rotate: '65deg' }], marginLeft: -10, marginTop: 12, borderRadius: 2 },
  pulseLine4: { width: 35, height: 4, backgroundColor: '#000', transform: [{ rotate: '-65deg' }], marginLeft: -12, marginTop: -12, borderRadius: 2 },
  pulseLine5: { width: 25, height: 4, backgroundColor: '#000', transform: [{ rotate: '50deg' }], marginLeft: -10, marginTop: 10, borderRadius: 2 },
  pulseLine6: { flex: 1, height: 4, backgroundColor: '#000', marginLeft: -6, borderRadius: 2 },

  // Small Cards
  vitalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'space-between',
  },
  smallCard: {
    width: '47.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: 36,
    padding: 20,
    minHeight: 140,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 2,
    shadowOffset: { width: 0, height: 8 },
    justifyContent: 'space-between',
  },
  smallCardEmpty: {
    width: '47.5%',
    backgroundColor: 'transparent',
  },
  smallCardHeader: {
    marginBottom: 16,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginTop: 8,
  },
});

// Shows on first load, blocks the app untill it's accepted
// Upon rejection closes the app and if the app is opened again show again

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  BackHandler,
  Alert,
  Linking,
} from 'react-native';

interface ConsentScreenProps {
  onAccept: () => void;
}

export default function ConsentScreen({ onAccept }: ConsentScreenProps) {
  const [scrolledToBottom, setScrolledToBottom] = useState(false);

  const handleScroll = ({ nativeEvent }: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
    const isBottom =
      layoutMeasurement.height + contentOffset.y >= contentSize.height - 40;
    if (isBottom) setScrolledToBottom(true);
  };

  const handleDecline = () => {
    Alert.alert(
      'The app will close',
      'Accept privacy policy to use the app.',
      [
        { text: 'Back', style: 'cancel' },
        {
          text: 'Close',
          style: 'destructive',
          onPress: () => BackHandler.exitApp(),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Privacy Policy</Text>
        <Text style={styles.subtitle}>
          We care about your privacy. Please read and accept the terms before using the application.
        </Text>

        <ScrollView
          style={styles.scrollArea}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={true}
        >
        <Text style={styles.sectionTitle}>1. Data Collection</Text>
        <Text style={styles.body}>
            The application collects the following data: name and email address for
            account creation, device location (for emergency responders during a medical emergency), health data (heart rate, blood oxygen, blood pressure, respiratory rate) from connected devices,
            and contact information of trusted persons that you enter yourself.
        </Text>

        <Text style={styles.sectionTitle}>2. Purpose of Data Collection</Text>
        <Text style={styles.body}>
            The data is used solely for providing services within the application:
            notifying trusted contacts in case of emergency, tracking health indicators 
            and for getting your data to licensed medical professionals in case of an emergency or health concern.
            We do not sell your data to third parties.
        </Text>

        <Text style={styles.sectionTitle}>3. Data Storage</Text>
        <Text style={styles.body}>
            Data is stored on secure servers within the EU and protected with
            encryption. Health data is stored locally on the device and will not be
            transmitted without your explicit consent.
        </Text>
        <Text style={styles.sectionTitle}>4. Your Rights</Text>
        <Text style={styles.body}>
            You have the right to access, correct, and delete your data at any time.
            To submit a request, contact us at{' '}
            <Text
            style={styles.link}
            onPress={() => Linking.openURL('mailto:privacy@your-app.com')}
            >
            privacy@your-app.com
            </Text>
            .
        </Text>

        <Text style={styles.sectionTitle}>5. Cookies and Tracking</Text>
        <Text style={styles.body}>
            The application does not use cookies for advertising. Analytics (Firebase
            Analytics) is used anonymously to improve the performance of the
            application.
        </Text>

        <Text style={styles.sectionTitle}>6. Policy Changes</Text>
        <Text style={styles.body}>
            You will be notified in the application about any changes to this policy
            and asked to confirm again before continuing to use the service.
        </Text>
          {/* Spacer na koncu, da je jasno da je konec */}
          <View style={styles.endSpacer}>
            <Text style={styles.endText}>— end of privacy policy —</Text>
          </View>
        </ScrollView>

        {!scrolledToBottom && (
          <Text style={styles.scrollHint}>
            Scroll to the bottom to confirm
          </Text>
        )}

        <View style={styles.buttons}>
          <TouchableOpacity
            style={styles.declineBtn}
            onPress={handleDecline}
          >
            <Text style={styles.declineTxt}>Decline</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.acceptBtn,
              !scrolledToBottom && styles.acceptBtnDisabled,
            ]}
            onPress={scrolledToBottom ? onAccept : undefined}
            disabled={!scrolledToBottom}
          >
            <Text style={styles.acceptTxt}>Accept</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 16,
  },
  scrollArea: {
    maxHeight: 380,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#e0e0e0',
    marginTop: 18,
    marginBottom: 6,
  },
  body: {
    fontSize: 14,
    color: '#aaa',
    lineHeight: 22,
  },
  link: {
    color: '#7c6cf0',
    textDecorationLine: 'underline',
  },
  endSpacer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  endText: {
    fontSize: 12,
    color: '#444',
  },
  scrollHint: {
    fontSize: 12,
    color: '#7c6cf0',
    textAlign: 'center',
    marginBottom: 8,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  declineBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3a3a3a',
    alignItems: 'center',
  },
  declineTxt: {
    color: '#888',
    fontSize: 15,
    fontWeight: '500',
  },
  acceptBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#7c6cf0',
    alignItems: 'center',
  },
  acceptBtnDisabled: {
    backgroundColor: '#3a3566',
    opacity: 0.5,
  },
  acceptTxt: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
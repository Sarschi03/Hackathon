import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  Dimensions,
  ImageBackground,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalization } from '@/hooks/use-localization';

const { width, height } = Dimensions.get('window');

export default function OnboardingWelcome() {
  const router = useRouter();
  const { t } = useLocalization();

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <ImageBackground
        source={require('../assets/images/onboarding.jpg')}
        style={styles.bg}
        resizeMode="cover"
      >
        {/* Dark overlay */}
        <View style={styles.overlay} />

        {/* Logo */}
        <View style={styles.logoWrapper}>
          <View style={styles.logoBox} />
          <Text style={styles.logoText}>
            <Text style={{ fontWeight: '300' }}>First</Text>
            <Text style={{ fontWeight: '700' }}>Line</Text>
          </Text>
        </View>

        {/* Bottom content */}
        <View style={styles.bottom}>
          <Text style={styles.headline}>{t('home_emergency_help')}</Text>
          <Text style={styles.body}>{t('onboarding_welcome')}</Text>

          {/* Glass buttons row */}
          <View style={styles.buttonRow}>
            <Pressable
              style={({ pressed }) => [styles.glassBtn, pressed && { opacity: 0.75 }]}
              onPress={() => router.push('/onboarding-slides')}
            >
              <Text style={styles.glassBtnText}>{t('btn_get_started')}</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.iconGlassBtn, pressed && { opacity: 0.75 }]}
              onPress={() => router.push('/onboarding-slides')}
            >
              <Ionicons name="arrow-forward" size={22} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
  bg: {
    flex: 1,
    width,
    height,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.52)',
  },
  logoWrapper: {
    alignItems: 'center',
    marginTop: 72,
  },
  logoBox: {
    width: 52,
    height: 52,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 8,
    marginBottom: 10,
  },
  logoText: {
    fontSize: 22,
    color: '#FFFFFF',
    letterSpacing: 0.5,
    fontFamily: 'Inter',
  },
  bottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 32,
    paddingBottom: 60,
  },
  headline: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 42,
    marginBottom: 18,
    textAlign: 'center',
    fontFamily: 'InterBold',
  },
  body: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.78)',
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 36,
    fontFamily: 'Inter',
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  glassBtn: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    paddingHorizontal: 36,
    paddingVertical: 16,
    borderRadius: 50,
    // Glass shimmer via shadow
    shadowColor: '#fff',
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  glassBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
    fontFamily: 'InterSemiBold',
  },
  iconGlassBtn: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#fff',
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
});

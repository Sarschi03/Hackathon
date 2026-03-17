import { useLocalization } from '@/hooks/use-localization';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  Dimensions,
  Image,
  ImageBackground,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

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
          <Image
            source={require('../assets/images/icon_white.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.logoText}>
            <Text style={{ fontWeight: '300' }}>Life</Text>
            <Text style={{ fontWeight: '700' }}>Line</Text>
          </Text>
        </View>

        {/* Bottom content */}
        <View style={styles.bottom}>
          <Text style={styles.headline}>{t('onboarding_hero')}</Text>
          <Text style={styles.body}>{t('onboarding_desc')}</Text>

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
  logoImage: {
    width: 120,
    height: 120,
    marginBottom: -30,
  },
  logoText: {
    fontSize: 18,
    color: '#747474ff',
    letterSpacing: 0.8,
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
    marginBottom: 80,
    fontFamily: 'Inter',
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  glassBtn: {
    backgroundColor: 'rgba(13, 13, 13, 0.18)',
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
    backgroundColor: 'rrgba(13, 13, 13, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#fff',
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
});

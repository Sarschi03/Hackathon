import { useLocalization } from '@/hooks/use-localization';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  ImageBackground,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const { width } = Dimensions.get('window');

type Slide = {
  key: string;
  icon: 'pulse' | 'medkit' | 'navigate';
  accent: string;
  kicker: string;
  title: string;
  desc: string;
};

export default function OnboardingSlides() {
  const router = useRouter();
  const { t } = useLocalization();
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const slides: Slide[] = [
    {
      key: '1',
      icon: 'pulse',
      accent: '#D94B5C',
      kicker: 'Alert',
      title: t('onboarding_1_title'),
      desc: t('onboarding_1_desc'),
    },
    {
      key: '2',
      icon: 'medkit',
      accent: '#1F7A8C',
      kicker: 'Context',
      title: t('onboarding_2_title'),
      desc: t('onboarding_2_desc'),
    },
    {
      key: '3',
      icon: 'navigate',
      accent: '#1A936F',
      kicker: 'Routing',
      title: t('onboarding_3_title'),
      desc: t('onboarding_3_desc'),
    },
  ];

  const goNext = () => {
    if (currentIndex < slides.length - 1) {
      const nextIndex = currentIndex + 1;
      flatListRef.current?.scrollToIndex({ index: nextIndex });
      setCurrentIndex(nextIndex);
    } else {
      router.replace('/login');
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <ImageBackground
        source={require('../assets/images/map.png')}
        style={styles.mapBg}
        resizeMode="cover"
        imageStyle={{ opacity: 0.25 }}
      />
      <View style={styles.radialGlow} />

      <View style={styles.logoWrapper}>
        <Image
          source={require('../assets/images/icon_black.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
        <Text style={styles.logoText}>
          <Text style={{ fontWeight: '300' }}>Life</Text>
          <Text style={{ fontWeight: '500' }}>Line</Text>
        </Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={slides}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.key}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <View style={[styles.featureCard, { borderColor: `${item.accent}33` }]}>
              <View style={[styles.featureBadge, { backgroundColor: item.accent }]}>
                <Ionicons name={item.icon} size={26} color="#FFFFFF" />
              </View>
              <Text style={styles.featureKicker}>{item.kicker}</Text>
              <Text style={styles.featureTitle}>{item.title}</Text>
              <View style={styles.featureGrid}>
                <View style={styles.featurePill}>
                  <Text style={styles.featurePillText}>Wearables</Text>
                </View>
                <View style={styles.featurePill}>
                  <Text style={styles.featurePillText}>Profiles</Text>
                </View>
                <View style={styles.featurePill}>
                  <Text style={styles.featurePillText}>Responders</Text>
                </View>
              </View>
              <View style={styles.featureTimeline}>
                <View style={[styles.timelineDot, { backgroundColor: item.accent }]} />
                <View style={styles.timelineLine} />
                <View style={styles.timelineDotMuted} />
                <View style={styles.timelineLine} />
                <View style={styles.timelineDotMuted} />
              </View>
            </View>
          </View>
        )}
        style={{ flexGrow: 0 }}
      />

      <View style={styles.dotsRow}>
        {slides.map((_, index) => (
          <View
            key={index}
            style={[styles.dot, index === currentIndex ? styles.dotActive : styles.dotInactive]}
          />
        ))}
      </View>

      <Text style={styles.title}>{slides[currentIndex].title}</Text>
      <Text style={styles.desc}>{slides[currentIndex].desc}</Text>

      <View style={styles.buttonRow}>
        <Pressable
          style={({ pressed }) => [styles.skipBtn, pressed && { opacity: 0.6 }]}
          onPress={() => router.replace('/login')}
        >
          <Text style={styles.skipText}>{t('btn_skip')}</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.continueBtn, pressed && { opacity: 0.85 }]}
          onPress={goNext}
        >
          <Text style={styles.continueText}>
            {currentIndex === slides.length - 1 ? t('btn_get_started') : t('btn_continue')}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F6F3EE',
    alignItems: 'center',
    paddingBottom: 50,
  },
  mapBg: {
    ...StyleSheet.absoluteFillObject,
  },
  radialGlow: {
    position: 'absolute',
    top: 120,
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: width,
    backgroundColor: 'rgba(80, 187, 255, 0.12)',
  },
  logoWrapper: {
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 20,
  },
  logoImage: {
    width: 100,
    height: 100,
    marginBottom: -25,
  },
  logoText: {
    fontSize: 18,
    color: '#1E1E1E',
    letterSpacing: 0.5,
    fontFamily: 'Inter',
  },
  slide: {
    width,
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  featureCard: {
    width: width - 80,
    minHeight: (width - 80) * 1.08,
    backgroundColor: 'rgba(255,255,255,0.84)',
    borderRadius: 32,
    padding: 28,
    borderWidth: 1,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 6,
  },
  featureBadge: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  featureKicker: {
    fontSize: 12,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: '#7C6F64',
    marginBottom: 12,
    fontFamily: 'InterSemiBold',
  },
  featureTitle: {
    fontSize: 28,
    lineHeight: 34,
    color: '#1F2937',
    fontFamily: 'InterBold',
    marginBottom: 18,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 28,
  },
  featurePill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: '#F1ECE4',
  },
  featurePillText: {
    color: '#5B5248',
    fontSize: 12,
    fontFamily: 'InterSemiBold',
  },
  featureTimeline: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 'auto',
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  timelineDotMuted: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#D6D0C7',
  },
  timelineLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#E5DED4',
    marginHorizontal: 10,
  },
  dotsRow: {
    flexDirection: 'row',
    marginTop: 26,
    gap: 10,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotActive: {
    backgroundColor: '#B23A48',
  },
  dotInactive: {
    backgroundColor: '#D8D1C8',
  },
  title: {
    fontSize: 24,
    color: '#1F2937',
    textAlign: 'center',
    marginTop: 30,
    marginHorizontal: 36,
    fontFamily: 'InterBold',
  },
  desc: {
    fontSize: 15,
    color: '#5F5A52',
    lineHeight: 24,
    textAlign: 'center',
    marginTop: 14,
    marginHorizontal: 40,
    flex: 1,
    fontFamily: 'Inter',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 28,
    marginTop: 20,
  },
  skipBtn: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 50,
    backgroundColor: 'rgba(31, 41, 55, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(31, 41, 55, 0.08)',
  },
  skipText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333333',
    fontFamily: 'InterMedium',
  },
  continueBtn: {
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 50,
    backgroundColor: '#1F2937',
  },
  continueText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'InterSemiBold',
  },
});

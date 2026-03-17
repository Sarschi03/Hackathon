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
  StyleSheet,
  Text,
  View,
} from 'react-native';

const { width } = Dimensions.get('window');

export default function OnboardingSlides() {
  const router = useRouter();
  const { t } = useLocalization();
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const slides = [
    {
      key: '1',
      title: t('onboarding_1_title'),
      desc: t('onboarding_1_desc'),
      image: require('../assets/images/mockup1.1.png'),
    },
    {
      key: '2',
      title: t('onboarding_2_title'),
      desc: t('onboarding_2_desc'),
      image: require('../assets/images/mockup_2.png'),
    },
    {
      key: '3',
      title: t('onboarding_3_title'),
      desc: t('onboarding_3_desc'),
      image: require('../assets/images/mockup_3.png'),
    },
  ];

  const goNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex(currentIndex + 1);
    } else {
      router.replace('/login');
    }
  };

  return (
    <View style={styles.root}>
      {/* Map background at 15% opacity */}
      <ImageBackground
        source={require('../assets/images/map.png')}
        style={styles.mapBg}
        resizeMode="cover"
        imageStyle={{ opacity: 0.25 }}
      />

      {/* Logo */}
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

      {/* Slides */}
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
            {/* Image or placeholder */}
            <View style={styles.imagePlaceholder}>
              {item.image ? (
                <Image
                  source={item.image}
                  style={[
                    styles.mockupImage,
                    item.key === '3' && { transform: [{ translateX: -40 }] }
                  ]}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.placeholderBox}>
                  <Ionicons name="image-outline" size={48} color="#C0C0C0" />
                </View>
              )}
            </View>
          </View>
        )}
        style={{ flexGrow: 0 }}
      />

      {/* Dots */}
      <View style={styles.dotsRow}>
        {slides.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === currentIndex ? styles.dotActive : styles.dotInactive]}
          />
        ))}
      </View>

      {/* Description */}
      <Text style={styles.desc}>{slides[currentIndex].desc}</Text>

      {/* Buttons */}
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    paddingBottom: 50,
  },
  mapBg: {
    ...StyleSheet.absoluteFillObject,
  },
  logoWrapper: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: -70,
  },
  logoImage: {
    width: 150,
    height: 150,
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
  imagePlaceholder: {
    width: width,
    height: width * 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mockupImage: {
    width: width * 1.1,
    height: width * 1.5,
  },
  placeholderBox: {
    width: width - 80,
    height: (width - 80) * 1.15,
    backgroundColor: '#D9D9D9',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    marginTop: -120,
    gap: 10,
    zIndex: 10,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotActive: {
    backgroundColor: '#1E1E1E',
  },
  dotInactive: {
    backgroundColor: '#D0D0D0',
  },
  desc: {
    fontSize: 16,
    color: '#4A4A4A',
    lineHeight: 24,
    textAlign: 'center',
    marginTop: 15,
    marginHorizontal: 40,
    flex: 1,
    fontFamily: 'Inter',
    zIndex: 10,
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
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
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
    backgroundColor: '#1E1E1E',
  },
  continueText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'InterSemiBold',
  },
});

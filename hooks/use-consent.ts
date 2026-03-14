import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

const CONSENT_KEY = 'hasConsented';

export function useConsent() {
  const [hasConsented, setHasConsented] = useState<boolean | null>(null);

 useEffect(() => {
  const checkConsent = async () => {
     if (__DEV__) {                    // only here for testing, remove later
      await AsyncStorage.removeItem(CONSENT_KEY);
    }
    const value: string | null = await AsyncStorage.getItem(CONSENT_KEY);
    setHasConsented(value === 'true');
  };
  checkConsent();
}, []);

  const acceptConsent = async () => {
    await AsyncStorage.setItem(CONSENT_KEY, 'true');
    setHasConsented(true);
  };

  return { hasConsented, acceptConsent};
}
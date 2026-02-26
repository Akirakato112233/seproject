import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'wit_rider_id';

export async function getOrCreateRiderId(): Promise<string> {
  try {
    const existing = await AsyncStorage.getItem(STORAGE_KEY);
    if (existing) {
      return existing;
    }

    const newId = `dev-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    await AsyncStorage.setItem(STORAGE_KEY, newId);
    return newId;
  } catch (err) {
    console.warn('getOrCreateRiderId failed, falling back to random id:', err);
    return `dev-${Date.now()}`;
  }
}


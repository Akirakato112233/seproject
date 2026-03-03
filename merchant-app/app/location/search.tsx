import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';

const LONGDO_API_KEY = process.env.EXPO_PUBLIC_LONGDO_MAP_API_KEY;

interface SearchResult {
  id: string;
  name: string;
  address: string;
  lat: number;
  lon: number;
}

export default function MerchantLocationSearchScreen() {
  const router = useRouter();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [gettingCurrentLocation, setGettingCurrentLocation] = useState(false);

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const navigateToStep5 = (
    lat: number,
    lon: number,
    address: string,
    subdistrict?: string,
    district?: string,
    province?: string,
    postalCode?: string
  ) => {
    router.replace({
      pathname: '/signup/onboarding/step-5',
      params: {
        lat: String(lat),
        lon: String(lon),
        address,
        subdistrict,
        district,
        province,
        postalCode,
      } as any,
    });
  };

  const searchLocation = async (text: string) => {
    if (!text.trim()) {
      setResults([]);
      return;
    }

    if (!LONGDO_API_KEY) {
      console.warn('⚠️ LONGDO_API_KEY is not set in merchant-app .env');
      Alert.alert('Error', 'LONGDO API key ไม่ถูกตั้งค่า (EXPO_PUBLIC_LONGDO_MAP_API_KEY)');
      return;
    }

    setLoading(true);
    try {
      const url = `https://search.longdo.com/mapsearch/json/search?keyword=${encodeURIComponent(
        text
      )}&key=${LONGDO_API_KEY}&limit=20`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      if (data && data.data && Array.isArray(data.data)) {
        const formattedResults = data.data.map((item: any, index: number) => ({
          id: item.id || `search-${index}`,
          name: item.name || item.w,
          address: item.address || item.province || item.district || 'Unknown Address',
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon),
        }));

        setResults(
          formattedResults.filter((r: SearchResult) => !isNaN(r.lat) && !isNaN(r.lon))
        );
      } else {
        setResults([]);
      }
    } catch (error) {
      console.error('Error searching location:', error);
      Alert.alert('Error', 'ค้นหาตำแหน่งไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (text: string) => {
    setQuery(text);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchLocation(text);
    }, 500);
  };

  const handleSelectLocation = (result: SearchResult) => {
    navigateToStep5(result.lat, result.lon, result.address);
  };

  const getCurrentLocation = async () => {
    setGettingCurrentLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'อนุญาตให้เข้าถึงตำแหน่งเพื่อใช้ฟีเจอร์นี้');
        setGettingCurrentLocation(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      let address = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
      let subdistrict = '';
      let district = '';
      let province = '';
      let postalCode = '';

      if (LONGDO_API_KEY) {
        try {
          const response = await fetch(
            `https://api.longdo.com/map/services/address?lat=${latitude}&lon=${longitude}&key=${LONGDO_API_KEY}`
          );
          if (response.ok) {
            const data = await response.json();
            if (data) {
              subdistrict = data.subdistrict || '';
              district = data.district || '';
              province = data.province || '';
              postalCode = data.postcode || '';
              if (data.subdistrict && data.district && data.province) {
                address = `${data.subdistrict}, ${data.district}, ${data.province} ${
                  data.postcode || ''
                }`;
              }
            }
          }
        } catch {
          // ignore reverse geocode failure
        }
      }

      navigateToStep5(latitude, longitude, address, subdistrict, district, province, postalCode);
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'ไม่สามารถดึงตำแหน่งปัจจุบันได้');
    } finally {
      setGettingCurrentLocation(false);
    }
  };

  const renderResultItem = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity
      style={styles.resultItem}
      onPress={() => handleSelectLocation(item)}
    >
      <View style={styles.resultIconContainer}>
        <Ionicons name="location-outline" size={24} color="#666" />
      </View>
      <View style={styles.resultTextContainer}>
        <Text style={styles.resultName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.resultAddress} numberOfLines={2}>
          {item.address}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>

          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="ค้นหาที่อยู่ร้าน"
              value={query}
              onChangeText={handleSearchChange}
              autoFocus
              autoCorrect={false}
            />
            {query.length > 0 && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => {
                  setQuery('');
                  setResults([]);
                }}
              >
                <Ionicons name="close-circle" size={20} color="#999" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {!query && (
          <View style={styles.optionsContainer}>
            <TouchableOpacity
              style={styles.optionItem}
              onPress={getCurrentLocation}
              disabled={gettingCurrentLocation}
            >
              <View style={styles.currentLocationIcon}>
                <Ionicons name="locate" size={24} color="#003bfdff" />
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>ใช้ตำแหน่งปัจจุบัน</Text>
                {gettingCurrentLocation ? (
                  <ActivityIndicator
                    size="small"
                    color="#009688"
                    style={{ alignSelf: 'flex-start' }}
                  />
                ) : (
                  <Text style={styles.optionSubtitle} numberOfLines={1}>
                    ใช้ GPS เพื่อระบุตำแหน่งร้าน
                  </Text>
                )}
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionItem}
              onPress={() => router.push('/location/map')}
            >
              <View style={styles.mapIcon}>
                <Ionicons name="map-outline" size={24} color="#666" />
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>เลือกบนแผนที่</Text>
                <Text style={styles.optionSubtitle}>เลื่อนแผนที่เพื่อระบุตำแหน่งร้าน</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>
          </View>
        )}

        {query.length > 0 && (
          loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#0E3A78" />
            </View>
          ) : results.length > 0 ? (
            <FlatList
              data={results}
              keyExtractor={(item, index) => `${item.id}-${index}`}
              renderItem={renderResultItem}
              keyboardShouldPersistTaps="handled"
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              contentContainerStyle={styles.listContent}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>ไม่พบผลลัพธ์สำหรับ \"{query}\"</Text>
            </View>
          )
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#003af7ff',
    height: 48,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    padding: 4,
  },
  optionsContainer: {
    paddingTop: 8,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  currentLocationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e0f2f1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  mapIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  optionSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 20,
  },
  resultItem: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  resultIconContainer: {
    width: 32,
    alignItems: 'center',
    marginRight: 12,
    paddingTop: 2,
  },
  resultTextContainer: {
    flex: 1,
  },
  resultName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  resultAddress: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  separator: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginLeft: 64,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});


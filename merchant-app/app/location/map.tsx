import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import Constants from 'expo-constants';

const LONGDO_API_KEY =
  process.env.EXPO_PUBLIC_LONGDO_MAP_API_KEY || Constants.expoConfig?.extra?.longdoMapApiKey;

export default function MerchantMapSelectionScreen() {
  const router = useRouter();
  const webViewRef = useRef<WebView>(null);

  const [loading, setLoading] = useState(true);
  const [gettingLocation, setGettingLocation] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<{
    name: string;
    address: string;
    lat: number;
    lon: number;
  } | null>(null);

  const [initialCoords, setInitialCoords] = useState({
    lat: 13.7563,
    lon: 100.5018,
  });

  useEffect(() => {
    const fetchCurrentLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          setInitialCoords({
            lat: location.coords.latitude,
            lon: location.coords.longitude,
          });
        }
      } catch {
        // ignore, use default coords
      } finally {
        setGettingLocation(false);
      }
    };

    fetchCurrentLocation();
  }, []);

  const mapHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <script src="https://api.longdo.com/map/?key=${LONGDO_API_KEY}"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; }
    #map { width: 100%; height: 100%; }
    #pin {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -100%);
      z-index: 1000;
      pointer-events: none;
      font-size: 36px;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <div id="pin">📍</div>
  <script>
    var map = new longdo.Map({
      placeholder: document.getElementById('map'),
      zoom: 15,
      location: { lon: ${initialCoords.lon}, lat: ${initialCoords.lat} },
    });

    function confirmLocation() {
      var center = map.location();
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'confirm',
        lat: center.lat,
        lon: center.lon,
        name: 'Selected Location',
        address: center.lat.toFixed(5) + ', ' + center.lon.toFixed(5),
      }));
    }

    function panToLocation(lat, lon) {
      map.location({ lon: lon, lat: lat }, true);
    }
  </script>
</body>
</html>
  `;

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

  const handleMessage = async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'confirm') {
        const { lat, lon } = data;
        let address = `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
        let subdistrict = '';
        let district = '';
        let province = '';
        let postalCode = '';

        if (LONGDO_API_KEY) {
          try {
            const res = await fetch(
              `https://api.longdo.com/map/services/address?lat=${lat}&lon=${lon}&key=${LONGDO_API_KEY}`
            );
            if (res.ok) {
              const geo = await res.json();
              if (geo) {
                subdistrict = geo.subdistrict || '';
                district = geo.district || '';
                province = geo.province || '';
                postalCode = geo.postcode || '';
                if (geo.subdistrict && geo.district && geo.province) {
                  address = [geo.road, geo.subdistrict, geo.district, geo.province, geo.postcode]
                    .filter(Boolean)
                    .join(', ');
                }
              }
            }
          } catch {
            // ignore reverse geocode failure
          }
        }

        const loc = { name: 'Selected Location', address, lat, lon };
        setSelectedLocation(loc);
        navigateToStep5(lat, lon, address, subdistrict, district, province, postalCode);
      }
    } catch (e) {
      console.error('handleMessage error:', e);
    }
  };

  const handleConfirm = () => {
    webViewRef.current?.injectJavaScript('confirmLocation(); true;');
  };

  const handleRecenterGPS = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        webViewRef.current?.injectJavaScript(
          `panToLocation(${location.coords.latitude}, ${location.coords.longitude}); true;`
        );
        setSelectedLocation(null);
      } else {
        Alert.alert('Permission Denied', 'กรุณาอนุญาตให้เข้าถึงตำแหน่งเพื่อใช้ฟีเจอร์นี้');
      }
    } catch (error) {
      Alert.alert('Error', 'ไม่สามารถดึงตำแหน่งปัจจุบันได้');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>เลือกบนแผนที่</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.mapContainer}>
        {!LONGDO_API_KEY ? (
          <View style={styles.loadingOverlay}>
            <Ionicons name="warning-outline" size={48} color="#E53935" />
            <Text style={styles.loadingText}>Longdo Map API key ไม่พบ</Text>
            <Text style={styles.loadingText}>
              ตรวจสอบ EXPO_PUBLIC_LONGDO_MAP_API_KEY ใน merchant-app/.env
            </Text>
          </View>
        ) : gettingLocation ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#0E3A78" />
            <Text style={styles.loadingText}>กำลังค้นหาตำแหน่งของคุณ...</Text>
          </View>
        ) : (
          <>
            <WebView
              ref={webViewRef}
              source={{ html: mapHTML }}
              style={styles.webview}
              onLoadStart={() => setLoading(true)}
              onLoadEnd={() => setLoading(false)}
              onMessage={handleMessage}
              javaScriptEnabled
              domStorageEnabled
              originWhitelist={['*']}
              mixedContentMode="always"
            />

            {!loading && (
              <TouchableOpacity style={styles.gpsButton} onPress={handleRecenterGPS}>
                <Ionicons name="locate" size={24} color="#0E3A78" />
              </TouchableOpacity>
            )}

            {loading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#0E3A78" />
                <Text style={styles.loadingText}>กำลังโหลดแผนที่...</Text>
              </View>
            )}
          </>
        )}
      </View>

      <View style={styles.bottomBar}>
        {selectedLocation ? (
          <View style={styles.selectedInfo}>
            <Ionicons name="location" size={20} color="#0E3A78" />
            <View style={styles.selectedText}>
              <Text style={styles.selectedName} numberOfLines={1}>
                {selectedLocation.name}
              </Text>
              <Text style={styles.selectedAddress} numberOfLines={1}>
                {selectedLocation.address}
              </Text>
            </View>
          </View>
        ) : (
          <Text style={styles.hintText}>เลื่อนแผนที่ให้หมุดอยู่ตำแหน่งหน้าร้านของคุณ</Text>
        )}

        <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
          <Text style={styles.confirmText}>{selectedLocation ? 'ยืนยันตำแหน่ง' : 'เลือกตำแหน่งนี้'}</Text>
        </TouchableOpacity>
      </View>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  webview: {
    flex: 1,
  },
  gpsButton: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#666',
    fontSize: 14,
  },
  bottomBar: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 12,
  },
  hintText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  selectedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  selectedText: {
    flex: 1,
  },
  selectedName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  selectedAddress: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  confirmButton: {
    backgroundColor: '#0E3A78',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});


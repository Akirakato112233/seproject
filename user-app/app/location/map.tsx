import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';
import { useLocation } from '../../context/LocationContext';
import * as Location from 'expo-location';

const LONGDO_API_KEY = process.env.EXPO_PUBLIC_LONGDO_MAP_API_KEY;

export default function MapSelectionScreen() {
  const router = useRouter();
  const { currentLocation, setLocation } = useLocation();
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
    lat: currentLocation?.lat ?? 103.7563,
    lon: currentLocation?.lon ?? 100.5018
  });

  useEffect(() => {
    // Try to get actual GPS location first before rendering map
    const fetchCurrentLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          setInitialCoords({
            lat: location.coords.latitude,
            lon: location.coords.longitude
          });
        }
      } catch (error) {
        console.log('Could not get GPS location, using default/saved location');
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

    // Add blue dot marker for current location
    window.myMarker = new longdo.Marker(
      { lat: ${initialCoords.lat}, lon: ${initialCoords.lon} },
      {
        title: 'ตำแหน่งของฉัน',
        icon: {
          html: '<div style="width:20px;height:20px;background:#4285F4;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>',
          offset: { x: 10, y: 10 }
        }
      }
    );
    map.Overlays.add(window.myMarker);

    map.Event.bind('overlayClick', function() {});

    map.Event.bind('drag', function() {
      var center = map.location();
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'drag',
        lat: center.lat,
        lon: center.lon,
      }));
    });

    map.Event.bind('zoom', function() {
      var center = map.location();
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'drag',
        lat: center.lat,
        lon: center.lon,
      }));
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
      // Update blue dot marker position
      if (window.myMarker) {
        map.Overlays.remove(window.myMarker);
      }
      window.myMarker = new longdo.Marker(
        { lat: lat, lon: lon },
        {
          title: 'ตำแหน่งของฉัน',
          icon: {
            html: '<div style="width:20px;height:20px;background:#4285F4;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>',
            offset: { x: 10, y: 10 }
          }
        }
      );
      map.Overlays.add(window.myMarker);
    }
  </script>
</body>
</html>
  `;

  const handleMessage = async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'confirm') {
        const { lat, lon } = data;
        let name = 'Selected Location';
        let address = `${lat.toFixed(5)}, ${lon.toFixed(5)}`;

        // Reverse geocode using Longdo API
        try {
          const res = await fetch(
            `https://api.longdo.com/map/services/address?lat=${lat}&lon=${lon}&key=${LONGDO_API_KEY}`
          );
          if (res.ok) {
            const geo = await res.json();
            if (geo.subdistrict && geo.district && geo.province) {
              name = `${geo.subdistrict}, ${geo.district}`;
              address = [geo.road, geo.subdistrict, geo.district, geo.province, geo.postcode]
                .filter(Boolean).join(', ');
            }
          }
        } catch (_) {}

        const loc = { name, address, lat, lon };
        setSelectedLocation(loc);
        await setLocation(loc);
        router.back();
        router.back();
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
        const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        webViewRef.current?.injectJavaScript(`panToLocation(${location.coords.latitude}, ${location.coords.longitude}); true;`);
        setSelectedLocation(null); // Clear selection to prompt re-selection at new coords
      } else {
        Alert.alert('Permission Denied', 'Please allow location access to use this feature.');
      }
    } catch (error) {
      Alert.alert('Error', 'Could not get your current location.');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Choose on Map</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        {gettingLocation ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#0E3A78" />
            <Text style={styles.loadingText}>Finding your location...</Text>
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
            
            {/* GPS Recenter Button */}
            {!loading && (
              <TouchableOpacity style={styles.gpsButton} onPress={handleRecenterGPS}>
                <Ionicons name="locate" size={24} color="#0E3A78" />
              </TouchableOpacity>
            )}

            {loading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#0E3A78" />
                <Text style={styles.loadingText}>Loading map...</Text>
              </View>
            )}
          </>
        )}
      </View>

      {/* Bottom confirm bar */}
      <View style={styles.bottomBar}>
        {selectedLocation ? (
          <View style={styles.selectedInfo}>
            <Ionicons name="location" size={20} color="#0E3A78" />
            <View style={styles.selectedText}>
              <Text style={styles.selectedName} numberOfLines={1}>{selectedLocation.name}</Text>
              <Text style={styles.selectedAddress} numberOfLines={1}>{selectedLocation.address}</Text>
            </View>
          </View>
        ) : (
          <Text style={styles.hintText}>Move the map to select a location</Text>
        )}

        <TouchableOpacity
          style={styles.confirmButton}
          onPress={handleConfirm}
        >
          <Text style={styles.confirmText}>
            {selectedLocation ? 'Confirm' : 'Select Here'}
          </Text>
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

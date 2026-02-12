import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Linking,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { WebView } from "react-native-webview";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { LatLng, useDelivery } from "../context/DeliveryContext";

// Longdo Map API Key
const LONGDO_API_KEY = process.env.EXPO_PUBLIC_LONGDO_MAP_API_KEY || "YOUR_LONGDO_API_KEY";

const DEFAULT_COORDS = {
  latitude: 13.0827,
  longitude: 100.9274,
};

export default function JobScreen() {
  const router = useRouter();
  const webViewRef = useRef<WebView | null>(null);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);

  const { active, markPickedUp, markDelivered } = useDelivery();

  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [myCoord, setMyCoord] = useState<LatLng>(DEFAULT_COORDS);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);

  const stage = active?.status === "picking_up" ? "pickup" : "dropoff";
  const target = useMemo<LatLng | null>(() => {
    if (!active) return null;
    return stage === "pickup" ? active.pickup : active.dropoff;
  }, [active, stage]);

  // location permission + real-time tracking
  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setHasLocationPermission(false);
          return;
        }
        setHasLocationPermission(true);

        // Get initial position
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (isMounted) {
          setMyCoord({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
        }

        // Start real-time tracking
        locationSubscription.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 3000, // Update every 3 seconds
            distanceInterval: 10, // Or every 10 meters
          },
          (location) => {
            if (isMounted) {
              setMyCoord({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              });
            }
          }
        );
      } catch {
        // ignore
      }
    })();

    return () => {
      isMounted = false;
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
    };
  }, []);

  // Update map when coordinates change
  useEffect(() => {
    if (webViewRef.current && target) {
      const script = `
        if (window.map && window.updateMyLocation) {
          window.updateMyLocation({ lat: ${myCoord.latitude}, lon: ${myCoord.longitude} });
        }
        true;
      `;
      webViewRef.current.injectJavaScript(script);
    }
  }, [myCoord.latitude, myCoord.longitude]);

  // Handle messages from WebView (route info)
  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === "routeInfo") {
        setRouteInfo({ distance: data.distance, duration: data.duration });
      }
    } catch {
      // ignore
    }
  };

  const centerToMe = async () => {
    try {
      if (!hasLocationPermission) return;
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setMyCoord({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });

      if (webViewRef.current) {
        const script = `
          if (window.map) {
            window.map.location({ lat: ${loc.coords.latitude}, lon: ${loc.coords.longitude} }, true);
            window.map.zoom(16, true);
          }
          true;
        `;
        webViewRef.current.injectJavaScript(script);
      }
    } catch {
      // ignore
    }
  };

  // Open navigation app (Google Maps, Apple Maps, or Longdo)
  const openNavigation = async () => {
    if (!target) return;

    const destLat = target.latitude;
    const destLon = target.longitude;
    const label = active?.status === "picking_up" ? "Pickup" : "Dropoff";

    // Try Longdo Map app first
    const longdoUrl = `longdo://route?flat=${myCoord.latitude}&flon=${myCoord.longitude}&tlat=${destLat}&tlon=${destLon}`;

    // Google Maps URL
    const googleMapsUrl = Platform.select({
      ios: `comgooglemaps://?saddr=${myCoord.latitude},${myCoord.longitude}&daddr=${destLat},${destLon}&directionsmode=driving`,
      android: `google.navigation:q=${destLat},${destLon}&mode=d`,
      default: `https://www.google.com/maps/dir/?api=1&origin=${myCoord.latitude},${myCoord.longitude}&destination=${destLat},${destLon}&travelmode=driving`,
    });

    // Apple Maps URL (iOS only)
    const appleMapsUrl = `maps://?saddr=${myCoord.latitude},${myCoord.longitude}&daddr=${destLat},${destLon}&dirflg=d`;

    // Web fallback
    const webUrl = `https://www.google.com/maps/dir/?api=1&origin=${myCoord.latitude},${myCoord.longitude}&destination=${destLat},${destLon}&travelmode=driving`;

    try {
      // Try Google Maps first on Android
      if (Platform.OS === "android") {
        const canOpenGoogle = await Linking.canOpenURL(googleMapsUrl);
        if (canOpenGoogle) {
          await Linking.openURL(googleMapsUrl);
          return;
        }
      }

      // Try Apple Maps on iOS
      if (Platform.OS === "ios") {
        const canOpenApple = await Linking.canOpenURL(appleMapsUrl);
        if (canOpenApple) {
          await Linking.openURL(appleMapsUrl);
          return;
        }
      }

      // Fallback to web
      await Linking.openURL(webUrl);
    } catch {
      // Last resort: open web URL
      await Linking.openURL(webUrl);
    }
  };

  const callPhone = async (phone?: string) => {
    if (!phone) return;
    try {
      await Linking.openURL(`tel:${phone}`);
    } catch {
      // ignore
    }
  };

  const messagePhone = async (phone?: string) => {
    if (!phone) return;
    try {
      await Linking.openURL(`sms:${phone}`);
    } catch {
      // ignore
    }
  };

  // Generate HTML for Longdo Map with real-time tracking
  const generateMapHTML = () => {
    const startLat = myCoord.latitude;
    const startLon = myCoord.longitude;
    const endLat = target?.latitude || startLat;
    const endLon = target?.longitude || startLon;
    const isPickupStage = active?.status === "picking_up";

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <script src="https://api.longdo.com/map/?key=${LONGDO_API_KEY}"></script>
        <style>
          * { margin: 0; padding: 0; }
          html, body { width: 100%; height: 100%; overflow: hidden; }
          #map { width: 100%; height: 100%; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          var map;
          var routeLine;
          var targetMarker;
          var myMarker;

          function init() {
            map = new longdo.Map({
              placeholder: document.getElementById('map'),
              zoom: 15,
              location: { lat: ${startLat}, lon: ${startLon} }
            });

            // Add current location marker (blue dot style)
            myMarker = new longdo.Marker(
              { lat: ${startLat}, lon: ${startLon} },
              {
                title: 'ตำแหน่งของฉัน',
                icon: {
                  html: '<div style="width:20px;height:20px;background:#4285F4;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>',
                  offset: { x: 10, y: 10 }
                }
              }
            );
            map.Overlays.add(myMarker);

            // Add target marker
            targetMarker = new longdo.Marker(
              { lat: ${endLat}, lon: ${endLon} },
              {
                title: '${isPickupStage ? "Pickup" : "Dropoff"}',
                icon: {
                  html: '<div style="width:30px;height:30px;background:${isPickupStage ? "#FF9800" : "#4CAF50"};border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;"><span style="color:white;font-size:14px;font-weight:bold;">${isPickupStage ? "P" : "D"}</span></div>',
                  offset: { x: 15, y: 15 }
                }
              }
            );
            map.Overlays.add(targetMarker);

            // Draw route
            drawRoute({ lat: ${startLat}, lon: ${startLon} }, { lat: ${endLat}, lon: ${endLon} });
          }

          function drawRoute(start, end) {
            // Remove old route
            if (routeLine) {
              map.Overlays.remove(routeLine);
            }

            // Use Longdo Routing API
            longdo.Util.route([start, end], {
              mode: longdo.RouteMode.Cost,
              type: longdo.RouteType.Drive
            }, function(result) {
              if (result && result.path && result.path.length > 0) {
                routeLine = new longdo.Polyline(result.path, {
                  lineWidth: 6,
                  lineColor: 'rgba(66, 133, 244, 0.9)',
                  borderWidth: 2,
                  borderColor: 'rgba(255, 255, 255, 0.9)'
                });
                map.Overlays.add(routeLine);

                // Send route info back to React Native
                if (result.data && result.data.length > 0) {
                  var info = result.data[0];
                  var distanceKm = (info.distance / 1000).toFixed(1);
                  var durationMin = Math.ceil(info.interval / 60);
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'routeInfo',
                    distance: distanceKm + ' km',
                    duration: durationMin + ' min'
                  }));
                }

                // Fit bounds
                var bounds = {
                  minLat: Math.min(start.lat, end.lat) - 0.005,
                  maxLat: Math.max(start.lat, end.lat) + 0.005,
                  minLon: Math.min(start.lon, end.lon) - 0.005,
                  maxLon: Math.max(start.lon, end.lon) + 0.005
                };
                map.bound(bounds);
              } else {
                // Fallback: draw straight line
                routeLine = new longdo.Polyline([start, end], {
                  lineWidth: 6,
                  lineColor: 'rgba(66, 133, 244, 0.9)',
                  borderWidth: 2,
                  borderColor: 'rgba(255, 255, 255, 0.9)'
                });
                map.Overlays.add(routeLine);
              }
            });
          }

          window.updateMyLocation = function(newPos) {
            if (myMarker) {
              myMarker.move(newPos);
            }
            // Redraw route from new position
            var targetPos = targetMarker ? targetMarker.location() : null;
            if (targetPos) {
              drawRoute(newPos, targetPos);
            }
          };

          window.updateRoute = function(start, end) {
            drawRoute(start, end);
            if (targetMarker) {
              targetMarker.move(end);
            }
          };

          init();
        </script>
      </body>
      </html>
    `;
  };

  // ถ้าไม่มีงาน active จริง ๆ
  if (!active) {
    return (
      <SafeAreaView style={s.emptyWrap}>
        <Ionicons name="briefcase-outline" size={44} color="#0F172A" />
        <Text style={s.emptyTitle}>No active job</Text>
        <Text style={s.emptySub}>รับงานจากหน้า Home ก่อนนะ</Text>

        <TouchableOpacity style={s.primaryBtn} onPress={() => router.replace("/(tabs)")}>
          <Text style={s.primaryBtnText}>Back to Home</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const isPickupStage = active.status === "picking_up";
  const stepTitle = isPickupStage ? "Pickup" : "Deliver";

  const placeName = isPickupStage ? active.shopName : active.customerName;
  const placeAddress = isPickupStage ? active.shopAddress : active.customerAddress;
  const phone = isPickupStage ? active.shopPhone : active.customerPhone;

  const onPrimary = () => {
    if (isPickupStage) {
      markPickedUp();
      return;
    }

    Alert.alert("Confirm", "Mark this job as delivered?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delivered",
        style: "default",
        onPress: () => {
          markDelivered();
          router.replace("/(tabs)");
        },
      },
    ]);
  };

  const primaryLabel = isPickupStage ? "Arrived" : "Delivered";

  return (
    <View style={s.container}>
      <WebView
        ref={webViewRef}
        source={{ html: generateMapHTML() }}
        style={s.map}
        scrollEnabled={false}
        bounces={false}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        originWhitelist={['*']}
        onMessage={handleWebViewMessage}
      />

      {/* Top bar */}
      <SafeAreaView style={s.topBar} pointerEvents="box-none">
        <View style={s.topRow}>
          <TouchableOpacity style={s.iconBtn} onPress={() => router.back()} activeOpacity={0.8}>
            <Ionicons name="chevron-back" size={22} color="#0F172A" />
          </TouchableOpacity>

          <View style={{ alignItems: "center" }}>
            <Text style={s.topTitle}>Job</Text>
            <Text style={s.topSub}>{stepTitle}</Text>
          </View>

          <TouchableOpacity style={s.iconBtn} onPress={centerToMe} activeOpacity={0.8}>
            <Ionicons name="locate-outline" size={20} color="#0F172A" />
          </TouchableOpacity>
        </View>

        {/* Route info badge */}
        {routeInfo && (
          <View style={s.routeInfoBadge}>
            <Ionicons name="navigate" size={14} color="#4285F4" />
            <Text style={s.routeInfoText}>{routeInfo.distance} • {routeInfo.duration}</Text>
          </View>
        )}
      </SafeAreaView>

      {/* Bottom sheet */}
      <View style={s.bottomCard}>
        <Text style={s.placeName}>{placeName}</Text>
        <Text style={s.placeAddr}>{placeAddress}</Text>

        <View style={s.metaRow}>
          <Text style={s.metaText}>{active.distance} • {active.items} items</Text>
          <Text style={s.feeText}>{active.fee.toFixed(2)}฿</Text>
        </View>

        {!!active.note && (
          <View style={s.noteRow}>
            <Ionicons name="document-text-outline" size={16} color="#64748B" />
            <Text style={s.noteText}>{active.note}</Text>
          </View>
        )}

        <View style={s.actionsRow}>
          <TouchableOpacity
            style={[s.actionChip, !phone && s.actionChipDisabled]}
            onPress={() => messagePhone(phone)}
            disabled={!phone}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={18} color="#0F172A" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.actionChip, !phone && s.actionChipDisabled]}
            onPress={() => callPhone(phone)}
            disabled={!phone}
          >
            <Ionicons name="call-outline" size={18} color="#0F172A" />
          </TouchableOpacity>

          {/* Navigate button - opens external map app */}
          <TouchableOpacity style={s.navigateBtn} onPress={openNavigation} activeOpacity={0.8}>
            <Ionicons name="navigate" size={18} color="#fff" />
            <Text style={s.navigateBtnText}>นำทาง</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.primaryBtnWide} onPress={onPrimary} activeOpacity={0.9}>
            <Text style={s.primaryBtnText}>{primaryLabel}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={s.backLink} onPress={() => router.replace("/(tabs)")}>
          <Text style={s.backLinkText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  map: { ...StyleSheet.absoluteFillObject },

  topBar: { ...StyleSheet.absoluteFillObject },
  topRow: {
    marginTop: 8,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.95)",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  topTitle: { fontSize: 16, fontWeight: "900", color: "#0F172A" },
  topSub: { marginTop: 2, fontSize: 12, fontWeight: "800", color: "#64748B" },

  routeInfoBadge: {
    alignSelf: "center",
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  routeInfoText: { fontSize: 14, fontWeight: "800", color: "#0F172A" },

  bottomCard: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 16,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },

  placeName: { fontSize: 18, fontWeight: "900", color: "#0F172A" },
  placeAddr: { marginTop: 4, color: "#64748B", fontWeight: "700" },

  metaRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  metaText: { color: "#64748B", fontWeight: "800" },
  feeText: { color: "#0F172A", fontWeight: "900" },

  noteRow: {
    marginTop: 10,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  noteText: { color: "#64748B", fontWeight: "700", flex: 1 },

  actionsRow: {
    marginTop: 14,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  actionChip: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#EEF2F7",
    alignItems: "center",
    justifyContent: "center",
  },
  actionChipDisabled: { opacity: 0.45 },

  navigateBtn: {
    height: 46,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: "#4285F4",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  navigateBtnText: { color: "#fff", fontWeight: "900", fontSize: 14 },

  primaryBtnWide: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#0E3A78",
    alignItems: "center",
    justifyContent: "center",
  },

  primaryBtn: {
    marginTop: 10,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#0E3A78",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  primaryBtnText: { color: "#fff", fontWeight: "900", fontSize: 16 },

  backLink: {
    marginTop: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  backLinkText: { color: "#64748B", fontWeight: "800" },

  emptyWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20, gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: "900", color: "#0F172A" },
  emptySub: { color: "#64748B", fontWeight: "700", marginBottom: 8 },
});

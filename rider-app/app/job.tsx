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
const LONGDO_API_KEY = process.env.EXPO_PUBLIC_LONGDO_MAP_API_KEY || "d4ceb6847662fe82cb2411759980ffa4";

const DEFAULT_COORDS = {
  latitude: 13.0827,
  longitude: 100.9274,
};

export default function JobScreen() {
  const router = useRouter();
  const webViewRef = useRef<WebView | null>(null);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);

  const { active, markPickedUp, markAtShop, markDelivered } = useDelivery();

  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [myCoord, setMyCoord] = useState<LatLng>(DEFAULT_COORDS);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);

  const stage = active?.status ?? "going_to_customer";
  const target = useMemo<LatLng | null>(() => {
    if (!active) return null;
    if (stage === "going_to_customer") return active.pickup;
    if (stage === "going_to_shop") return active.shop ?? active.pickup;
    return active.dropoff;
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

  // Re-draw route when stage changes (target changes)
  useEffect(() => {
    if (webViewRef.current && target) {
      const script = `
        if (window.setRoute) {
          window.setRoute(
            { lat: ${myCoord.latitude}, lon: ${myCoord.longitude} },
            { lat: ${target.latitude}, lon: ${target.longitude} }
          );
        }
        true;
      `;
      webViewRef.current.injectJavaScript(script);
    }
  }, [stage]);

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

  // Open Google Maps turn-by-turn navigation (no API key needed)
  const openNavigation = async (lat: number, lng: number) => {
    const destination = `${lat},${lng}`;

    if (Platform.OS === "android") {
      // Android: เปิด Google Maps เข้า navigation mode ทันที
      const url = `google.navigation:q=${destination}&mode=d`;
      Linking.openURL(url);
    } else {
      // iOS: ลอง Google Maps ก่อน, fallback Apple Maps
      const googleMapsURL = `comgooglemaps://?daddr=${destination}&directionsmode=driving`;
      const appleMapsURL = `http://maps.apple.com/?daddr=${destination}&dirflg=d`;

      const canOpenGoogle = await Linking.canOpenURL("comgooglemaps://");
      if (canOpenGoogle) {
        Linking.openURL(googleMapsURL);
      } else {
        Linking.openURL(appleMapsURL);
      }
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

  // Generate HTML for Longdo Map with map.Route routing
  const generateMapHTML = () => {
    const startLat = myCoord.latitude;
    const startLon = myCoord.longitude;
    const endLat = target?.latitude || startLat;
    const endLon = target?.longitude || startLon;

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
          var myMarker;

          function init() {
            map = new longdo.Map({
              placeholder: document.getElementById('map'),
              zoom: 15,
              location: { lat: ${startLat}, lon: ${startLon} }
            });

            // Rider position marker (blue dot) — standalone overlay, ไม่เกี่ยวกับ Route
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

            // Initial route
            window.setRoute(
              { lat: ${startLat}, lon: ${startLon} },
              { lat: ${endLat}, lon: ${endLon} }
            );
          }

          // ===== map.Route API: ให้ Longdo คำนวณ+วาดเส้นทางอัตโนมัติ =====
          window.setRoute = function(origin, destination) {
            // ล้างเส้นทางเก่า
            map.Route.clear();

            // จุดเริ่มต้น (ซ่อน marker เพราะมี blue dot แล้ว)
            map.Route.add(new longdo.Marker(origin, {
              icon: {
                html: '<div style="width:0;height:0;"></div>',
                offset: { x: 0, y: 0 }
              }
            }));

            // ปลายทาง (marker สีน้ำเงินเข้ม)
            map.Route.add(new longdo.Marker(destination, {
              title: 'ปลายทาง',
              icon: {
                html: '<div style="width:30px;height:30px;background:#0E3A78;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;"><span style="color:white;font-size:14px;">📍</span></div>',
                offset: { x: 15, y: 15 }
              }
            }));

            // ให้ Longdo คำนวณและวาดเส้นทาง
            map.Route.search();

            // ดึงข้อมูลระยะทาง/เวลา ผ่าน Util.route (data only, ไม่วาดซ้ำ)
            try {
              longdo.Util.route([origin, destination], {
                mode: longdo.RouteMode.Cost,
                type: longdo.RouteType.Drive
              }, function(result) {
                if (result && result.data && result.data.length > 0) {
                  var info = result.data[0];
                  var distanceKm = (info.distance / 1000).toFixed(1);
                  var durationMin = Math.ceil(info.interval / 60);
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'routeInfo',
                    distance: distanceKm + ' km',
                    duration: durationMin + ' min'
                  }));
                }
              });
            } catch(e) {}

            // Zoom ให้เห็นทั้ง origin + destination
            setTimeout(function() {
              try {
                var bounds = {
                  minLat: Math.min(origin.lat, destination.lat) - 0.005,
                  maxLat: Math.max(origin.lat, destination.lat) + 0.005,
                  minLon: Math.min(origin.lon, destination.lon) - 0.005,
                  maxLon: Math.max(origin.lon, destination.lon) + 0.005
                };
                map.bound(bounds);
              } catch(e) {}
            }, 800);
          };

          // ขยับ blue dot ตามตำแหน่งจริง (ไม่วาด route ใหม่)
          window.updateMyLocation = function(newPos) {
            if (myMarker) {
              myMarker.move(newPos);
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

  const stepTitles: Record<string, string> = {
    going_to_customer: "ไปรับผ้า",
    going_to_shop: "ไปร้าน",
    delivering: "ไปส่งผ้า",
  };
  const stepTitle = stepTitles[active.status] ?? "Job";

  const placeName =
    stage === "going_to_shop" ? active.shopName : active.customerName;
  const placeAddress =
    stage === "going_to_shop" ? active.shopAddress : active.customerAddress;
  const phone =
    stage === "going_to_shop" ? active.shopPhone : active.customerPhone;

  const onPrimary = () => {
    if (stage === "going_to_customer") {
      markPickedUp();
      return;
    }
    if (stage === "going_to_shop") {
      markAtShop();
      return;
    }
    Alert.alert("ยืนยัน", "ส่งผ้าให้ลูกค้าเรียบร้อยแล้ว?", [
      { text: "ยกเลิก", style: "cancel" },
      {
        text: "ส่งแล้ว",
        style: "default",
        onPress: () => {
          markDelivered();
          router.replace("/(tabs)");
        },
      },
    ]);
  };

  const primaryLabels: Record<string, string> = {
    going_to_customer: "รับผ้าแล้ว",
    going_to_shop: "ถึงร้านแล้ว",
    delivering: "ส่งแล้ว",
  };
  const primaryLabel = primaryLabels[active.status] ?? "ดำเนินการ";

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

          {/* Navigate button - opens Google Maps / Apple Maps */}
          <TouchableOpacity style={s.navigateBtn} onPress={() => { if (target) openNavigation(target.latitude, target.longitude); }} activeOpacity={0.8}>
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

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
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, Region } from "react-native-maps";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { LatLng, useDelivery } from "../context/DeliveryContext";

// --- Silver map style (เหมือนหน้า Home) ---
const silverMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#f5f5f5" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#eeeeee" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#dadada" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#c9c9c9" }] },
];

const DEFAULT_REGION: Region = {
  latitude: 13.0827,
  longitude: 100.9274,
  latitudeDelta: 0.04,
  longitudeDelta: 0.04,
};

// NOTE:
// - โปรเจกต์ใหม่ของ Google Maps Platform มักต้องใช้ Routes API แทน Directions (legacy)
// - เราใช้ key เดียวกันจาก .env เพื่อเรียก Routes API
// - ถ้าไม่มี key (หรือเรียกไม่สำเร็จ) จะ fallback ไปเส้นตรงเหมือนเดิม
const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

const ROUTES_API_ENDPOINT = "https://routes.googleapis.com/directions/v2:computeRoutes";

function decodePolyline(encoded: string): LatLng[] {
  // Google Encoded Polyline Algorithm Format
  let index = 0;
  let lat = 0;
  let lng = 0;
  const coordinates: LatLng[] = [];

  while (index < encoded.length) {
    let b = 0;
    let shift = 0;
    let result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlat = (result & 1) ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlng = (result & 1) ? ~(result >> 1) : result >> 1;
    lng += dlng;

    coordinates.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }

  return coordinates;
}

async function fetchRoute(origin: LatLng, destination: LatLng): Promise<LatLng[] | null> {
  // ถ้าไม่มี key -> ไม่ fetch (แสดงเส้นตรงแทน)
  if (!GOOGLE_MAPS_API_KEY) return null;

  // ✅ Routes API (แนะนำ)
  // ต้องส่ง X-Goog-FieldMask ไม่งั้นจะ error
  try {
    const res = await fetch(ROUTES_API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
        "X-Goog-FieldMask": "routes.polyline.encodedPolyline",
      },
      body: JSON.stringify({
        origin: { location: { latLng: { latitude: origin.latitude, longitude: origin.longitude } } },
        destination: {
          location: { latLng: { latitude: destination.latitude, longitude: destination.longitude } },
        },
        travelMode: "DRIVE",
      }),
    });

    if (res.ok) {
      const json = await res.json();
      const encoded: string | undefined = json?.routes?.[0]?.polyline?.encodedPolyline;
      if (encoded) return decodePolyline(encoded);
    } else {
      // เผื่อไว้ debug ใน dev
      const txt = await res.text();
      console.warn("Routes API error", res.status, txt);
    }
  } catch (e) {
    console.warn("Routes API fetch failed", e);
  }

  // (ทางเลือก) Fallback: Directions (legacy) เผื่อโปรเจกต์เก่าเปิดไว้แล้ว
  // ถ้าเป็นโปรเจกต์ใหม่ อันนี้อาจโดน REQUEST_DENIED/ไม่เปิดให้ใช้
  try {
    const url =
      `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}` +
      `&destination=${destination.latitude},${destination.longitude}` +
      `&mode=driving&key=${GOOGLE_MAPS_API_KEY}`;

    const res = await fetch(url);
    const json = await res.json();
    const points: string | undefined = json?.routes?.[0]?.overview_polyline?.points;
    if (points) return decodePolyline(points);
  } catch {
    // ignore
  }

  return null;
}

export default function JobScreen() {
  const router = useRouter();
  const mapRef = useRef<MapView | null>(null);

  const { active, markPickedUp, markDelivered } = useDelivery();

  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [myRegion, setMyRegion] = useState<Region>(DEFAULT_REGION);
  const [myCoord, setMyCoord] = useState<LatLng>({
    latitude: DEFAULT_REGION.latitude,
    longitude: DEFAULT_REGION.longitude,
  });

  const [routeCoords, setRouteCoords] = useState<LatLng[]>([]);

  const stage = active?.status === "picking_up" ? "pickup" : "dropoff";
  const target = useMemo<LatLng | null>(() => {
    if (!active) return null;
    return stage === "pickup" ? active.pickup : active.dropoff;
  }, [active, stage]);

  // location permission + initial position
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setHasLocationPermission(false);
          return;
        }
        setHasLocationPermission(true);

        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });

        const region: Region = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        };

        setMyRegion(region);
        setMyCoord({ latitude: region.latitude, longitude: region.longitude });
        mapRef.current?.animateToRegion(region, 600);
      } catch {
        // ignore
      }
    })();
  }, []);

  const centerToMe = async () => {
    try {
      if (!hasLocationPermission) return;
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const region: Region = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };
      setMyRegion(region);
      setMyCoord({ latitude: region.latitude, longitude: region.longitude });
      mapRef.current?.animateToRegion(region, 600);
    } catch {
      // ignore
    }
  };

  // build route (directions polyline if key exists; otherwise straight line)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!target) return;

      const origin: LatLng = { latitude: myCoord.latitude, longitude: myCoord.longitude };
      const route = await fetchRoute(origin, target);

      if (cancelled) return;

      const coords = route ?? [origin, target];
      setRouteCoords(coords);

      // fit camera
      try {
        if (coords.length >= 2) {
          mapRef.current?.fitToCoordinates(coords, {
            edgePadding: { top: 90, right: 60, bottom: 280, left: 60 },
            animated: true,
          });
        }
      } catch {
        // ignore
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [target?.latitude, target?.longitude, myCoord.latitude, myCoord.longitude]);

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
      // ไปต่อขั้น Deliver
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
      <MapView
        ref={mapRef}
        provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
        style={s.map}
        initialRegion={myRegion}
        customMapStyle={silverMapStyle}
        showsUserLocation={hasLocationPermission}
        showsMyLocationButton={false}
      >
        {!!target && (
          <Marker coordinate={target} title={isPickupStage ? "Pickup" : "Dropoff"} />
        )}

        {/* เส้นทาง (Google-like) */}
        {routeCoords.length >= 2 && (
          <>
            {/* outline */}
            <Polyline
              coordinates={routeCoords}
              strokeWidth={9}
              strokeColor="rgba(255,255,255,0.92)"
              lineCap="round"
              lineJoin="round"
            />
            {/* main */}
            <Polyline
              coordinates={routeCoords}
              strokeWidth={5}
              strokeColor="#2F80ED"
              lineCap="round"
              lineJoin="round"
            />
          </>
        )}
      </MapView>

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
            <Text style={s.actionChipText}>Messages</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.actionChip, !phone && s.actionChipDisabled]}
            onPress={() => callPhone(phone)}
            disabled={!phone}
          >
            <Ionicons name="call-outline" size={18} color="#0F172A" />
            <Text style={s.actionChipText}>Call</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.primaryBtnWide} onPress={onPrimary} activeOpacity={0.9}>
            <Text style={s.primaryBtnText}>{primaryLabel}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={s.backLink} onPress={() => router.replace("/(tabs)")}>
          <Text style={s.backLinkText}>Back to Home</Text>
        </TouchableOpacity>

        {!GOOGLE_MAPS_API_KEY && (
          <Text style={s.hintText}>
            * ถ้าอยากได้เส้นทางวิ่งตามถนนแบบรูป ให้ใส่ EXPO_PUBLIC_GOOGLE_MAPS_API_KEY (เปิด Routes API)
          </Text>
        )}
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
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },
  topTitle: { fontSize: 16, fontWeight: "900", color: "#0F172A" },
  topSub: { marginTop: 2, fontSize: 12, fontWeight: "800", color: "#64748B" },

  bottomCard: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 16,
    elevation: 10,
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
    gap: 10,
    alignItems: "center",
  },
  actionChip: {
    height: 46,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: "#EEF2F7",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  actionChipDisabled: { opacity: 0.45 },
  actionChipText: { fontWeight: "900", color: "#0F172A" },

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

  hintText: { marginTop: 6, color: "#94A3B8", fontWeight: "700", fontSize: 12, textAlign: "center" },

  emptyWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20, gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: "900", color: "#0F172A" },
  emptySub: { color: "#64748B", fontWeight: "700", marginBottom: 8 },
});

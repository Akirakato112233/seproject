import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import { WebView } from "react-native-webview";
import * as Location from "expo-location";
import { useDelivery, Order, LatLng } from "../../context/DeliveryContext";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";

// Longdo Map API Key
const LONGDO_API_KEY = process.env.EXPO_PUBLIC_LONGDO_MAP_API_KEY || "YOUR_LONGDO_API_KEY";

// พิกัดมหาวิทยาลัยเกษตรศาสตร์ วิทยาเขตศรีราชา
// 199 ตำบลทุ่งสุขลา อำเภอศรีราชา ชลบุรี 20230
const DEFAULT_COORDS: LatLng = {
  latitude: 13.1219,
  longitude: 100.9209,
};

function formatMMSS(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// ✅ เพิ่ม type ครอบเพื่อให้มี details ได้ (เฉพาะ demo)
type OrderWithDetails = Order & { details?: string };

export default function HomeScreen() {
  const router = useRouter();
  const tabBarHeight = useBottomTabBarHeight();
  const webViewRef = useRef<WebView | null>(null);

  const {
    available,
    active,
    declineOrder,
    startOrder,
    isOnline,
    toggleOnline,
    autoAccept,
    toggleAutoAccept,
  } = useDelivery();

  // --- Demo order (typed) ---
  const [simulatedOrder, setSimulatedOrder] = useState<OrderWithDetails | null>(null);
  const demoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const demoOnceRef = useRef(false); // กันเด้งซ้ำๆ จนกว่าจะ offline

  // รวมงานจริงกับงาน demo
  const firstRequest: OrderWithDetails | null =
    (!active && available.length > 0 ? (available[0] as OrderWithDetails) : null) || simulatedOrder;

  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [myCoord, setMyCoord] = useState<LatLng>(DEFAULT_COORDS);
  const [locationReady, setLocationReady] = useState(false);

  // Success Modal
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [pendingOrder, setPendingOrder] = useState<OrderWithDetails | null>(null);

  // Offer countdown
  const [offerExpiresAt, setOfferExpiresAt] = useState<number | null>(null);
  const [nowTick, setNowTick] = useState(Date.now());

  const showOffer = isOnline && !!firstRequest && !active && !showSuccessModal;

  const remainingMs = useMemo(() => {
    if (!offerExpiresAt) return 0;
    return Math.max(0, offerExpiresAt - nowTick);
  }, [offerExpiresAt, nowTick]);

  // ✅ Demo logic (ไม่ใช้ any) + กันเด้งซ้ำ
  useEffect(() => {
    // เคลียร์ timer เก่าทุกครั้ง
    if (demoTimerRef.current) {
      clearTimeout(demoTimerRef.current);
      demoTimerRef.current = null;
    }

    // reset วงรอบ demo เมื่อ offline
    if (!isOnline) {
      demoOnceRef.current = false;
      setSimulatedOrder(null);
      return;
    }

    // ถ้ามีงานจริง/มีงาน active แล้ว ไม่ต้อง demo
    if (active || available.length > 0) {
      setSimulatedOrder(null);
      return;
    }

    // demo แค่ครั้งเดียวต่อรอบ online
    if (demoOnceRef.current) return;

    demoTimerRef.current = setTimeout(() => {
      demoOnceRef.current = true;
      setSimulatedOrder({
        id: "#ORD-DEMO",
        customerName: "K. Somsak",
        distance: "2.5 km",
        fee: 85.0,
        shopName: "Wash & Dry Station",
        shopAddress: "Pattaya Sai 3",
        customerAddress: "Unixx Condo",
        items: 10,
        pickup: { latitude: 12.9478, longitude: 100.8884 },
        dropoff: { latitude: 12.9266, longitude: 100.8789 },
        details: "ซักอบรีด (10 ชิ้น)",
      });
    }, 2500);

    return () => {
      if (demoTimerRef.current) {
        clearTimeout(demoTimerRef.current);
        demoTimerRef.current = null;
      }
    };
  }, [isOnline, active, available.length]);

  // ขอ Permission + ตำแหน่ง
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setHasLocationPermission(false);
          setLocationReady(true); // แสดงแผนที่แม้ไม่ได้ permission
          return;
        }
        setHasLocationPermission(true);

        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        setMyCoord({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
        setLocationReady(true);
      } catch {
        setLocationReady(true); // แสดงแผนที่แม้เกิด error
      }
    })();
  }, []);

  const centerToMe = async () => {
    try {
      if (!hasLocationPermission) return;
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setMyCoord({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

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

  // Generate Longdo Map HTML
  const generateMapHTML = () => {
    const lat = myCoord.latitude;
    const lon = myCoord.longitude;

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
          var map = new longdo.Map({
            placeholder: document.getElementById('map'),
            zoom: 15,
            location: { lat: ${lat}, lon: ${lon} }
          });

          // Add blue dot marker for current location
          var myMarker = new longdo.Marker(
            { lat: ${lat}, lon: ${lon} },
            {
              title: 'ตำแหน่งของฉัน',
              icon: {
                html: '<div style="width:20px;height:20px;background:#4285F4;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>',
                offset: { x: 10, y: 10 }
              }
            }
          );
          map.Overlays.add(myMarker);
        </script>
      </body>
      </html>
    `;
  };

  // เริ่มนับเวลา offer เมื่อโชว์งานเข้า
  useEffect(() => {
    if (showOffer) {
      setOfferExpiresAt(Date.now() + 3 * 60 * 1000); // 3 นาที
      setNowTick(Date.now());
      return;
    }
    setOfferExpiresAt(null);
  }, [showOffer, firstRequest?.id]);

  // tick + หมดเวลาแล้ว auto-decline
  useEffect(() => {
    if (!showOffer || !offerExpiresAt) return;

    const t = setInterval(() => {
      const n = Date.now();
      setNowTick(n);
      if (offerExpiresAt - n <= 0) {
        clearInterval(t);

        const id = firstRequest?.id;
        if (!id) return;

        if (id === "#ORD-DEMO") {
          setSimulatedOrder(null);
        } else {
          declineOrder(id);
        }
      }
    }, 250);

    return () => clearInterval(t);
  }, [showOffer, offerExpiresAt, firstRequest?.id, declineOrder]);

  // AutoAccept: ถ้าเปิดไว้แล้ว active โผล่ ให้เด้งไป /job อัตโนมัติ (กันวน)
  const lastNavIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!autoAccept) return;
    if (!active?.id) return;
    if (lastNavIdRef.current === active.id) return;
    lastNavIdRef.current = active.id;
    router.push("/job");
  }, [autoAccept, active?.id]);

  const handlePressAccept = () => {
    const id = firstRequest?.id;
    if (!id) return;
    setPendingOrder(firstRequest);
    setShowSuccessModal(true);
  };

  const handleConfirmJob = () => {
    if (!pendingOrder) return;

    // demo รับแล้วให้หายไปด้วย (กัน popup กลับมา)
    if (pendingOrder.id === "#ORD-DEMO") setSimulatedOrder(null);

    // ✅ ให้ demo/ของจริง กลายเป็น active เหมือนกัน
    startOrder(pendingOrder);

    setPendingOrder(null);
    setShowSuccessModal(false);
    router.push("/job");
  };

  const handleDecline = () => {
    const id = firstRequest?.id;
    if (!id) return;

    if (id === "#ORD-DEMO") {
      setSimulatedOrder(null);
    } else {
      declineOrder(id);
    }
  };

  const hideOverlays = showOffer || showSuccessModal;

  return (
    <View style={s.container}>
      <WebView
        key={`map-${myCoord.latitude}-${myCoord.longitude}`}
        ref={webViewRef}
        source={{ html: generateMapHTML() }}
        style={s.map}
        scrollEnabled={false}
        bounces={false}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        originWhitelist={['*']}
      />

      {/* Overlay */}
      <SafeAreaView style={s.overlay} pointerEvents="box-none">
        {!hideOverlays && (
          <>
            <View style={s.floatingControls} pointerEvents="box-none">
              {!isOnline ? (
                <TouchableOpacity style={s.btnGoOnline} onPress={toggleOnline} activeOpacity={0.9}>
                  <Ionicons name="power" size={20} color="#fff" />
                  <Text style={s.btnGoOnlineText}>Go Online</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={s.btnPowerGreen} onPress={toggleOnline} activeOpacity={0.9}>
                  <Ionicons name="power" size={26} color="#fff" />
                </TouchableOpacity>
              )}

              <TouchableOpacity style={s.btnCompass} onPress={centerToMe} activeOpacity={0.9}>
                <FontAwesome5 name="location-arrow" size={18} color="#000" />
              </TouchableOpacity>
            </View>

            <View style={[s.bottomStack, { paddingBottom: tabBarHeight + 14 }]}>
              <View style={s.cardStatus}>
                <View style={[s.dot, { backgroundColor: isOnline ? "#22C55E" : "#EF4444" }]} />
                <Text style={s.textStatus}>{isOnline ? "You're Online." : "You're offline."}</Text>

                {active && (
                  <TouchableOpacity style={s.activePill} onPress={() => router.push("/job")}>
                    <Text style={s.activePillText}>Active</Text>
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity style={s.cardAutoAccept} onPress={toggleAutoAccept} activeOpacity={0.85}>
                <View style={s.autoAcceptContent}>
                  <Ionicons name="flash" size={24} color="#1E3A8A" />
                  <Text style={s.textAutoAccept}>Auto Accept</Text>
                  <Text style={s.autoState}>{autoAccept ? "On" : "Off"}</Text>
                </View>
              </TouchableOpacity>
            </View>
          </>
        )}
      </SafeAreaView>

      {/* Incoming Order Popup */}
      {showOffer && firstRequest && (
        <View style={s.incomingContainer}>
          <View style={s.incomingCard}>
            <View style={s.incomingHeader}>
              <View style={s.headerLeft}>
                <View style={s.logoBox}>
                  <Ionicons name="shirt" size={16} color="#fff" />
                </View>
                <View>
                  <Text style={s.brandName}>WIT CONCEPT</Text>
                  <Text style={s.subBrand}>ACCEPT PICKUP</Text>
                </View>
              </View>
              <Text style={s.timeAgo}>Just now</Text>
            </View>

            <View style={s.mainInfoRow}>
              <View>
                <Text style={s.customerName}>{firstRequest.customerName ?? "Customer"}</Text>
                <View style={s.distanceRow}>
                  <Ionicons name="navigate-outline" size={14} color="#666" />
                  <Text style={s.distanceText}>
                    {" "}
                    {firstRequest.distance || "1 KM"} away • {firstRequest.id}
                  </Text>
                </View>
              </View>

              <View style={{ alignItems: "flex-end" }}>
                <Text style={s.priceText}>{Number(firstRequest.fee).toFixed(2)}฿</Text>
                <Text style={s.paymentText}>เงินสด</Text>
              </View>
            </View>

            <View style={s.divider} />

            <View style={s.detailList}>
              <View style={s.detailItem}>
                <View style={s.iconCircleLight}>
                  <MaterialCommunityIcons name="washing-machine" size={20} color="#0E3A78" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.detailTitle}>Wash & Fold Service</Text>
                  <Text style={s.detailSub}>
                    {firstRequest.details ?? `Items: ${firstRequest.items ?? 0}`}
                  </Text>
                </View>
              </View>

              <View style={s.detailItem}>
                <View style={s.iconCircleLight}>
                  <Ionicons name="location" size={20} color="#0E3A78" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.detailTitle}>From</Text>
                  <Text style={s.detailSub}>
                    {firstRequest.shopName} ({firstRequest.shopAddress})
                  </Text>
                </View>
              </View>

              <View style={s.detailItem}>
                <View style={s.iconCircleLight}>
                  <Ionicons name="storefront" size={18} color="#0E3A78" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.detailTitle}>To</Text>
                  <Text style={s.detailSub}>{firstRequest.customerAddress}</Text>
                </View>
              </View>
            </View>

            <View style={s.btnRow}>
              <TouchableOpacity style={s.btnDecline} onPress={handleDecline}>
                <Text style={s.btnDeclineText}>Decline</Text>
              </TouchableOpacity>

              <TouchableOpacity style={s.btnAccept} onPress={handlePressAccept}>
                <Ionicons name="checkmark-circle-outline" size={20} color="#fff" style={{ marginRight: 6 }} />
                <Text style={s.btnAcceptText}>Accept</Text>
              </TouchableOpacity>
            </View>

            <Text style={s.expireText}>• OFFER EXPIRES IN {formatMMSS(remainingMs)} •</Text>
          </View>
        </View>
      )}

      {/* Success Modal */}
      <Modal
        transparent
        visible={showSuccessModal}
        animationType="fade"
        onRequestClose={() => {
          setShowSuccessModal(false);
          setPendingOrder(null);
        }}
      >
        <View style={s.modalOverlay}>
          <View style={s.successCard}>
            <Text style={s.successTitle}>Job accepted</Text>

            <View style={s.successIconCircle}>
              <Ionicons name="checkmark" size={50} color="#002DE3" />
            </View>

            <Text style={s.successSub}>Let’s go!</Text>

            <TouchableOpacity style={s.btnApply} onPress={handleConfirmJob}>
              <Text style={s.btnApplyText}>Apply</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={s.btnCancel}
              onPress={() => {
                setShowSuccessModal(false);
                setPendingOrder(null);
              }}
            >
              <Text style={s.btnCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  map: { ...StyleSheet.absoluteFillObject },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: "flex-end" },

  floatingControls: {
    height: 68,
    paddingHorizontal: 20,
    marginBottom: 10,
    justifyContent: "flex-end",
  },

  btnGoOnline: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#202020",
    paddingHorizontal: 30,
    paddingVertical: 14,
    borderRadius: 30,
    elevation: 6,
  },
  btnGoOnlineText: { color: "#fff", fontWeight: "900", fontSize: 16, marginLeft: 8 },

  btnPowerGreen: {
    position: "absolute",
    left: 20,
    bottom: 0,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#22C55E",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    borderWidth: 2,
    borderColor: "#fff",
  },

  btnCompass: {
    position: "absolute",
    right: 20,
    bottom: 4,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
  },

  bottomStack: { paddingHorizontal: 15, paddingBottom: 0 },
  cardStatus: {
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 3,
  },
  dot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  textStatus: { fontSize: 16, fontWeight: "600", color: "#000", flex: 1 },

  activePill: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "#0E3A78",
    alignItems: "center",
    justifyContent: "center",
  },
  activePillText: { color: "#fff", fontWeight: "900" },

  cardAutoAccept: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
  },
  autoAcceptContent: { flexDirection: "row", alignItems: "center", gap: 10 },
  textAutoAccept: { fontSize: 16, color: "#000", fontWeight: "700" },
  autoState: { marginLeft: 6, color: "#64748B", fontWeight: "900" },

  incomingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  incomingCard: {
    backgroundColor: "#fff",
    width: "90%",
    borderRadius: 24,
    padding: 20,
    paddingBottom: 22,
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },
  incomingHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 15 },
  headerLeft: { flexDirection: "row", gap: 10, alignItems: "center" },

  logoBox: {
    width: 32,
    height: 32,
    backgroundColor: "#007AFF",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  brandName: { color: "#007AFF", fontWeight: "900", fontSize: 13 },
  subBrand: { color: "#666", fontSize: 11, fontWeight: "700" },
  timeAgo: { color: "#999", fontSize: 12, fontWeight: "700" },

  mainInfoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 15 },
  customerName: { fontSize: 20, fontWeight: "900", color: "#000" },
  distanceRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  distanceText: { color: "#666", fontSize: 13, fontWeight: "700" },
  priceText: { fontSize: 20, fontWeight: "900", color: "#000" },
  paymentText: { color: "#22C55E", fontWeight: "900", fontSize: 14, textAlign: "right" },

  divider: { height: 1, backgroundColor: "#f0f0f0", marginVertical: 10 },

  detailList: { marginBottom: 16 },
  detailItem: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  iconCircleLight: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F0F5FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  detailTitle: { fontWeight: "900", fontSize: 14, color: "#333" },
  detailSub: { color: "#777", fontSize: 12, marginTop: 2, fontWeight: "700", flexShrink: 1 },

  btnRow: { flexDirection: "row", gap: 12, height: 50 },
  btnDecline: { flex: 1, backgroundColor: "#F3F4F6", borderRadius: 12, alignItems: "center", justifyContent: "center" },
  btnDeclineText: { fontWeight: "900", color: "#444", fontSize: 16 },

  btnAccept: {
    flex: 1.5,
    backgroundColor: "#007AFF",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#007AFF",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  btnAcceptText: { fontWeight: "900", color: "#fff", fontSize: 16 },

  expireText: {
    textAlign: "center",
    color: "#FF3B30",
    fontSize: 11,
    fontWeight: "900",
    marginTop: 14,
    letterSpacing: 0.5,
  },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" },
  successCard: { width: "75%", backgroundColor: "#fff", borderRadius: 24, padding: 26, alignItems: "center", elevation: 10 },
  successTitle: { fontSize: 20, fontWeight: "900", marginBottom: 18, color: "#000" },
  successIconCircle: { width: 80, height: 80, borderRadius: 40, borderWidth: 4, borderColor: "#002DE3", alignItems: "center", justifyContent: "center", marginBottom: 18 },
  successSub: { fontSize: 18, fontWeight: "800", color: "#333", marginBottom: 18 },

  btnApply: { backgroundColor: "#102A56", width: "100%", height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  btnApplyText: { color: "#fff", fontWeight: "900", fontSize: 16 },

  btnCancel: { marginTop: 10, width: "100%", height: 46, borderRadius: 14, backgroundColor: "#EEF2F7", alignItems: "center", justifyContent: "center" },
  btnCancelText: { color: "#334155", fontWeight: "900" },
});

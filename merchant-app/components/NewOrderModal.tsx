import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Colors } from '../constants/colors';

export interface NewOrderData {
  id: string;
  customerName: string;
  distance: string;
  total: number;
  paymentMethod: string;
  serviceType: string;
  serviceDetail: string;
  pickupTime: string;
  note?: string;
  expiresIn?: number;
  _rawId?: string;
}

interface NewOrderModalProps {
  visible: boolean;
  order: NewOrderData | null;
  orders: NewOrderData[];
  currentIndex: number;
  onAccept: () => void;
  onDecline: () => void;
  onPrev: () => void;
  onNext: () => void;
}

function formatOrderId(id: string) {
  return `#${id.slice(-8).toUpperCase()}`;
}

function formatMMSS(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function NewOrderModal({
  visible,
  order,
  orders,
  currentIndex,
  onAccept,
  onDecline,
  onPrev,
  onNext,
}: NewOrderModalProps) {
  const [remainingMs, setRemainingMs] = useState(0);

  const canGoPrev = orders.length > 1 && currentIndex > 0;
  const canGoNext = orders.length > 1 && currentIndex < orders.length - 1;

  useEffect(() => {
    if (!visible || !order) return;
    const expiresInSec = order.expiresIn ?? 180;
    const endAt = Date.now() + expiresInSec * 1000;
    const tick = () => {
      const ms = Math.max(0, endAt - Date.now());
      setRemainingMs(ms);
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [visible, order, currentIndex]);

  if (!order) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableWithoutFeedback onPress={onDecline}>
        <View style={s.overlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={s.modalTouchWrap}>
                <View style={s.modal}>
                  {/* Header - like rider */}
                  <View style={s.incomingHeader}>
                    <View style={s.headerLeft}>
                      <View style={s.logoBox}>
                        <Ionicons name="shirt" size={16} color="#fff" />
                      </View>
                      <View>
                        <Text style={s.brandName}>WIT CONCEPT</Text>
                        <Text style={s.subBrand}>NEW ORDER</Text>
                      </View>
                    </View>
                    <Text style={s.timeAgo}>Just now</Text>
                  </View>

                  {/* Main info row: customer + price */}
                  <View style={s.mainInfoRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.customerName}>{order.customerName}</Text>
                      <View style={s.distanceBlock}>
                        <View style={s.distanceRow}>
                          <Ionicons name="navigate-outline" size={14} color="#666" />
                          <Text style={s.distanceText}>
                            ไปรับของที่บ้านลูกค้า: {order.distance}
                          </Text>
                        </View>
                        <Text style={s.orderIdText}>{formatOrderId(order._rawId || order.id)}</Text>
                      </View>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={s.priceText}>{order.total.toFixed(2)}฿</Text>
                      <Text style={s.paymentText}>{order.paymentMethod}</Text>
                    </View>
                  </View>

                  <View style={s.divider} />

                  {/* Detail list */}
                  <ScrollView
                    style={s.detailScroll}
                    contentContainerStyle={s.detailScrollContent}
                    showsVerticalScrollIndicator={false}
                  >
                    <View style={s.detailItem}>
                      <View style={s.iconCircleLight}>
                        <Ionicons name="shirt-outline" size={20} color="#0E3A78" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.detailTitle}>{order.serviceType}</Text>
                        <Text style={s.detailSub}>{order.serviceDetail}</Text>
                      </View>
                    </View>

                    <View style={s.detailItem}>
                      <View style={s.iconCircleLight}>
                        <Ionicons name="time-outline" size={20} color="#0E3A78" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.detailTitle}>{order.pickupTime}</Text>
                        <Text style={s.detailSub}>Pickup</Text>
                      </View>
                    </View>

                    {!!order.note && (
                      <View style={s.detailItem}>
                        <View style={s.iconCircleLight}>
                          <Ionicons name="document-text-outline" size={18} color="#0E3A78" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={s.detailTitle}>Note</Text>
                          <Text style={s.detailSub}>{order.note}</Text>
                        </View>
                      </View>
                    )}
                  </ScrollView>

                  {/* Buttons */}
                  <View style={s.btnRow}>
                    <TouchableOpacity style={s.btnDecline} onPress={onDecline} activeOpacity={0.7}>
                      <Text style={s.btnDeclineText}>Decline</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={s.btnAccept} onPress={onAccept} activeOpacity={0.85}>
                      <Ionicons
                        name="checkmark-circle-outline"
                        size={20}
                        color="#fff"
                        style={{ marginRight: 6 }}
                      />
                      <Text style={s.btnAcceptText}>Accept</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Timer */}
                  <Text style={s.expireText}>
                    • OFFER EXPIRES IN {formatMMSS(remainingMs)} •
                  </Text>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 400,
    gap: 4,
  },
  navBtn: {
    padding: 4,
    minWidth: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnDisabled: { opacity: 0.4 },
  modalTouchWrap: { width: '90%', minWidth: 0, maxWidth: 380 },
  modal: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    paddingBottom: 22,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    maxHeight: Math.min(Dimensions.get('window').height * 0.82, 560),
  },
  incomingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  headerLeft: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  logoBox: {
    width: 32,
    height: 32,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: { color: '#007AFF', fontWeight: '900', fontSize: 13 },
  subBrand: { color: '#666', fontSize: 11, fontWeight: '700' },
  timeAgo: { color: '#999', fontSize: 12, fontWeight: '700' },
  mainInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  customerName: { fontSize: 20, fontWeight: '900', color: '#000' },
  distanceBlock: { marginTop: 4 },
  distanceRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  distanceText: { color: '#666', fontSize: 13, fontWeight: '700' },
  orderIdText: { color: '#999', fontSize: 12, marginTop: 4, fontWeight: '600' },
  priceText: { fontSize: 20, fontWeight: '900', color: '#000' },
  paymentText: { color: '#22C55E', fontWeight: '900', fontSize: 14, textAlign: 'right' },
  divider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 10 },
  detailScroll: { maxHeight: 160 },
  detailScrollContent: { paddingBottom: 8 },
  detailItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  iconCircleLight: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F5FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  detailTitle: { fontWeight: '900', fontSize: 14, color: '#333' },
  detailSub: { color: '#777', fontSize: 12, marginTop: 2, fontWeight: '700' },
  btnRow: { flexDirection: 'row', gap: 12, height: 50 },
  btnDecline: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDeclineText: { fontWeight: '900', color: '#444', fontSize: 16 },
  btnAccept: {
    flex: 1.5,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#007AFF',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  btnAcceptText: { fontWeight: '900', color: '#fff', fontSize: 16 },
  expireText: {
    textAlign: 'center',
    color: '#FF3B30',
    fontSize: 11,
    fontWeight: '900',
    marginTop: 14,
    letterSpacing: 0.5,
  },
});

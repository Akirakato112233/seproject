import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  Modal,
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
  _rawId?: string; // MongoDB _id สำหรับเรียก API
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
  const [timeLeft, setTimeLeft] = useState(order?.expiresIn ?? 180);

  useEffect(() => {
    if (!visible || !order) return;
    setTimeLeft(order.expiresIn ?? 180);
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [visible, order]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  if (!order) return null;

  const canGoPrev = orders.length > 1 && currentIndex > 0;
  const canGoNext = orders.length > 1 && currentIndex < orders.length - 1;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableWithoutFeedback>
        <View style={s.overlay}>
          <View style={s.modalRow}>
            <TouchableOpacity
              style={[s.navBtn, !canGoPrev && s.navBtnDisabled]}
              onPress={onPrev}
              disabled={!canGoPrev}
            >
              <Ionicons
                name="chevron-back"
                size={32}
                color={canGoPrev ? Colors.primaryBlue : Colors.textMuted}
              />
            </TouchableOpacity>
            <TouchableWithoutFeedback>
              <View style={s.modal}>
              <View style={s.modalHeader}>
                <View style={s.headerLeft}>
                  <View style={s.logoIcon}>
                    <Ionicons name="shirt-outline" size={24} color={Colors.primaryBlue} />
                  </View>
                  <View>
                    <Text style={s.brandText}>WIT CONCEPT</Text>
                    <Text style={s.newOrderText}>NEW ORDER</Text>
                  </View>
                </View>
                <Text style={s.justNow}>Just now</Text>
              </View>

              <View style={s.customerRow}>
                <Text style={s.customerName}>{order.customerName}</Text>
                <View style={s.locationRow}>
                  <Ionicons name="paper-plane-outline" size={14} color={Colors.textSecondary} />
                  <Text style={s.distance}>{order.distance} away</Text>
                </View>
                <Text style={s.orderId}>#{order.id}</Text>
              </View>

              <View style={s.paymentRow}>
                <Text style={s.amount}>{order.total.toFixed(2)}฿</Text>
                <Text style={s.paymentMethod}>{order.paymentMethod}</Text>
              </View>

              <View style={s.detailCard}>
                <View style={s.detailRow}>
                  <View style={s.detailIcon}>
                    <Ionicons name="shirt-outline" size={18} color={Colors.textPrimary} />
                  </View>
                  <View style={s.detailContent}>
                    <Text style={s.detailLabel}>{order.serviceType}</Text>
                    <Text style={s.detailValue}>{order.serviceDetail}</Text>
                  </View>
                </View>
                <View style={s.detailRow}>
                  <View style={s.detailIcon}>
                    <Ionicons name="time-outline" size={18} color={Colors.textPrimary} />
                  </View>
                  <View style={s.detailContent}>
                    <Text style={s.detailLabel}>{order.pickupTime}</Text>
                    <Text style={s.detailValue}>Pickup</Text>
                  </View>
                </View>
                {order.note && (
                  <View style={s.detailRow}>
                    <View style={s.detailIcon}>
                      <Ionicons name="document-text-outline" size={18} color={Colors.textPrimary} />
                    </View>
                    <View style={s.detailContent}>
                      <Text style={s.detailLabel}>Note</Text>
                      <Text style={s.detailValue}>{order.note}</Text>
                    </View>
                  </View>
                )}
              </View>

              <View style={s.buttons}>
                <TouchableOpacity style={s.declineBtn} onPress={onDecline}>
                  <Text style={s.declineText}>Decline</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.acceptBtn} onPress={onAccept}>
                  <Ionicons name="checkmark" size={20} color={Colors.white} />
                  <Text style={s.acceptText}>Accept</Text>
                </TouchableOpacity>
              </View>

              <Text style={s.expires}>OFFER EXPIRES IN {timeStr}</Text>
              </View>
            </TouchableWithoutFeedback>
            <TouchableOpacity
              style={[s.navBtn, !canGoNext && s.navBtnDisabled]}
              onPress={onNext}
              disabled={!canGoNext}
            >
              <Ionicons
                name="chevron-forward"
                size={32}
                color={canGoNext ? Colors.primaryBlue : Colors.textMuted}
              />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 440,
    gap: 8,
  },
  navBtn: {
    padding: 8,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnDisabled: {
    opacity: 0.4,
  },
  modal: {
    flex: 1,
    maxWidth: 400,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: { fontSize: 14, fontWeight: '700', color: Colors.primaryBlue },
  newOrderText: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  justNow: { fontSize: 12, color: Colors.textMuted },
  customerRow: { marginBottom: 12 },
  customerName: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  distance: { fontSize: 13, color: Colors.textSecondary },
  orderId: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  paymentRow: { marginBottom: 16 },
  amount: { fontSize: 24, fontWeight: '800', color: Colors.successGreen },
  paymentMethod: { fontSize: 14, color: Colors.successGreen, marginTop: 2 },
  detailCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  detailIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  detailContent: { flex: 1 },
  detailLabel: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  detailValue: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  buttons: { flexDirection: 'row', gap: 12 },
  declineBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.primaryBlue,
    alignItems: 'center',
  },
  declineText: { fontSize: 16, fontWeight: '700', color: Colors.primaryBlue },
  acceptBtn: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.primaryBlue,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  acceptText: { fontSize: 16, fontWeight: '700', color: Colors.white },
  expires: { fontSize: 12, color: '#dc2626', textAlign: 'center', marginTop: 12 },
});

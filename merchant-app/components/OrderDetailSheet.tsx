import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Colors } from '../constants/colors';

export type OrderDetailStatus = 'washing' | 'in_progress' | 'ready_for_delivery';

export interface OrderDetailData {
  id: string;
  status: OrderDetailStatus;
  total: number;
  isPaid: boolean;
  paymentMethod: string;
  customerName: string;
  customerPhone: string;
  orderDate: string;
  riderName?: string;
  riderPhone?: string;
  services?: { name: string; qty: string; price: number }[];
  note?: string;
}

interface OrderDetailSheetProps {
  visible: boolean;
  order: OrderDetailData | null;
  onClose: () => void;
  onAction: () => void;
}

export function OrderDetailSheet({
  visible,
  order,
  onClose,
  onAction,
}: OrderDetailSheetProps) {
  if (!order) return null;

  const isWashing = order.status === 'washing';
  const isInProgress = order.status === 'in_progress';
  const actionLabel = isWashing ? 'Ready for Pickup' : 'Rider arrived';
  const statusLabel = isWashing ? 'WASHING' : isInProgress ? 'In Progress' : 'Ready for Delivery';

  return (
    <Modal visible={visible} transparent animationType="slide">
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={s.overlay}>
          <TouchableWithoutFeedback>
            <View style={s.sheet}>
              <View style={s.dragHandle} />
              <View style={s.header}>
                <View>
                  <Text style={s.orderId}>ORD-{order.id}</Text>
                  <View
                    style={[
                      s.statusBadge,
                      isWashing ? s.statusWashing : isInProgress ? s.statusInProgress : s.statusReady,
                    ]}
                  >
                    <Text style={s.statusText}>
                      {statusLabel}
                    </Text>
                  </View>
                </View>
                <View style={s.headerRight}>
                  <View style={s.paymentBadge}>
                    <Text style={s.paymentBadgeText}>{order.paymentMethod}</Text>
                  </View>
                  <TouchableOpacity onPress={onClose}>
                    <Ionicons name="close" size={24} color={Colors.textMuted} />
                  </TouchableOpacity>
                </View>
              </View>

              <ScrollView style={s.content} showsVerticalScrollIndicator={false}>
                <View style={s.totalCard}>
                  <Text style={s.totalLabel}>Total Amount</Text>
                  <Text style={s.totalAmount}>{order.total.toFixed(2)}฿</Text>
                  <View style={s.paidRow}>
                    <Ionicons
                      name={order.isPaid ? 'lock-closed' : 'document-text'}
                      size={14}
                      color="rgba(255,255,255,0.9)"
                    />
                    <Text style={s.paidText}>{order.isPaid ? 'Paid' : 'Unpaid'}</Text>
                  </View>
                </View>

                <View style={s.card}>
                  <View style={s.cardHeader}>
                    <Ionicons name="person-outline" size={18} color={Colors.textPrimary} />
                    <Text style={s.cardTitle}>Customer Details</Text>
                  </View>
                  <View style={s.detailRow}>
                    <Text style={s.detailLabel}>Name</Text>
                    <Text style={s.detailValue}>{order.customerName}</Text>
                  </View>
                  <View style={s.detailRow}>
                    <Text style={s.detailLabel}>Phone</Text>
                    <Text style={s.detailValue}>{order.customerPhone}</Text>
                  </View>
                  <View style={s.detailRow}>
                    <Text style={s.detailLabel}>Order Date</Text>
                    <Text style={s.detailValue}>{order.orderDate}</Text>
                  </View>
                </View>

                {order.riderName && (
                  <View style={s.card}>
                    <View style={s.cardHeader}>
                      <Ionicons name="bicycle-outline" size={18} color={Colors.textPrimary} />
                      <Text style={s.cardTitle}>Rider Details</Text>
                    </View>
                    <View style={s.detailRow}>
                      <Text style={s.detailLabel}>Name</Text>
                      <Text style={s.detailValue}>{order.riderName}</Text>
                    </View>
                    <View style={s.detailRow}>
                      <Text style={s.detailLabel}>Phone</Text>
                      <Text style={s.detailValue}>{order.riderPhone}</Text>
                    </View>
                  </View>
                )}

                {isWashing && order.services && order.services.length > 0 && (
                  <View style={s.card}>
                    <View style={s.cardHeader}>
                      <Ionicons name="list-outline" size={18} color={Colors.textPrimary} />
                      <Text style={s.cardTitle}>Service List</Text>
                    </View>
                    {order.services.map((svc, i) => (
                      <View key={i} style={s.serviceRow}>
                        <View style={s.serviceLeft}>
                          <View style={s.serviceIcon}>
                            <Ionicons name="shirt-outline" size={18} color={Colors.primaryBlue} />
                          </View>
                          <View>
                            <Text style={s.serviceName}>{svc.name}</Text>
                            <Text style={s.serviceQty}>{svc.qty}</Text>
                          </View>
                        </View>
                        <Text style={s.servicePrice}>{svc.price}฿</Text>
                      </View>
                    ))}
                  </View>
                )}

                {isWashing && order.note && (
                  <View style={s.card}>
                    <View style={s.cardHeader}>
                      <Ionicons
                        name="document-text-outline"
                        size={18}
                        color={Colors.textPrimary}
                      />
                      <Text style={s.cardTitle}>Note</Text>
                    </View>
                    <Text style={s.noteText}>{order.note}</Text>
                  </View>
                )}
              </ScrollView>

              <TouchableOpacity style={s.actionBtn} onPress={onAction} activeOpacity={0.8}>
                <Text style={s.actionBtnText}>{actionLabel}</Text>
                <Ionicons name="arrow-forward" size={20} color={Colors.white} />
              </TouchableOpacity>
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.cardBorder,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  orderId: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  statusWashing: { backgroundColor: Colors.primaryBlue },
  statusInProgress: { backgroundColor: '#f59e0b' },
  statusReady: { backgroundColor: Colors.successGreen },
  statusText: { fontSize: 12, fontWeight: '700', color: Colors.white },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  paymentBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: Colors.successGreen,
  },
  paymentBadgeText: { fontSize: 12, fontWeight: '600', color: Colors.white },
  content: { padding: 20, maxHeight: 400 },
  totalCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    backgroundColor: Colors.primaryBlue,
  },
  totalLabel: { fontSize: 12, color: 'rgba(255,255,255,0.9)' },
  totalAmount: { fontSize: 32, fontWeight: '800', color: Colors.white, marginTop: 4 },
  paidRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  paidText: { fontSize: 12, color: 'rgba(255,255,255,0.9)' },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailLabel: { fontSize: 13, color: Colors.textMuted },
  detailValue: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBg,
  },
  serviceLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  serviceIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  serviceQty: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  servicePrice: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  noteText: { fontSize: 14, color: Colors.textSecondary },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    margin: 20,
    marginTop: 8,
    borderRadius: 12,
    backgroundColor: Colors.primaryBlue,
    gap: 8,
  },
  actionBtnText: { fontSize: 16, fontWeight: '700', color: Colors.white },
});

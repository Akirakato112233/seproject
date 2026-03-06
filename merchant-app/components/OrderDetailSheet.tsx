import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Dimensions,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Colors } from '../constants/colors';

export type OrderDetailStatus = 'new_order' | 'wait_for_rider' | 'washing' | 'in_progress' | 'ready_for_delivery' | 'completed';

export interface OrderDetailData {
  id: string;
  status: OrderDetailStatus;
  statusLabel?: string;  // override สำหรับแสดง "Looking for rider" vs "Waiting for rider"
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
  showAction?: boolean;
  actionLabel?: string;
  /** สำหรับ new_order: แสดงปุ่ม Accept + Decline */
  isNewOrder?: boolean;
}

interface OrderDetailSheetProps {
  visible: boolean;
  order: OrderDetailData | null;
  onClose: () => void;
  onAction: () => void;
  onDecline?: () => void;
  actionLoading?: boolean;
}

export function OrderDetailSheet({
  visible,
  order,
  onClose,
  onAction,
  onDecline,
  actionLoading,
}: OrderDetailSheetProps) {
  if (!order) return null;

  const isNewOrder = order.status === 'new_order' || order.isNewOrder;
  const isWaitForRider = order.status === 'wait_for_rider';
  const isWashing = order.status === 'washing';
  const isInProgress = order.status === 'in_progress';
  const isCompleted = order.status === 'completed';
  const statusLabel =
    order.statusLabel ??
    (isNewOrder
      ? 'New order'
      : isCompleted
        ? 'Completed'
        : isWaitForRider
          ? 'Waiting for rider'
          : isWashing
            ? 'In progress'
            : isInProgress
              ? 'Ready for pickup'
              : 'Delivering');
  const actionLabel =
    order.actionLabel ??
    (isNewOrder ? 'Accept' : isWaitForRider ? 'Rider arrived' : isWashing ? 'Ready for pickup' : isInProgress ? 'Rider picked up' : '');
  const showAction = !isCompleted && order.showAction !== false && !!actionLabel;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={s.overlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={s.overlayTouch} />
        </TouchableWithoutFeedback>
        <View style={s.sheet} pointerEvents="box-none">
          <View style={s.dragHandle} />
          <View style={s.header}>
            <View>
              <Text style={s.orderId}>ORD-{order.id}</Text>
              <View
                style={[
                  s.statusBadge,
                  isNewOrder
                    ? s.statusNew
                    : isCompleted
                      ? s.statusCompleted
                      : isWaitForRider
                        ? s.statusWait
                        : isWashing
                          ? s.statusWashing
                          : isInProgress
                            ? s.statusInProgress
                            : s.statusReady,
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

          <ScrollView
            style={s.content}
            contentContainerStyle={s.contentContainer}
            showsVerticalScrollIndicator={true}
            bounces={true}
            nestedScrollEnabled={true}
            scrollEventThrottle={16}
          >
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
                <View style={s.phoneRow}>
                  <Text style={s.detailValue}>{order.customerPhone}</Text>
                  {!!order.customerPhone && (
                    <TouchableOpacity onPress={() => Linking.openURL(`tel:${order.customerPhone}`)}>
                      <Ionicons name="call" size={16} color={Colors.successGreen} style={{ marginLeft: 6 }} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
              <View style={s.detailRow}>
                <Text style={s.detailLabel}>Order Date</Text>
                <Text style={s.detailValue}>{order.orderDate}</Text>
              </View>
              <View style={s.detailRow}>
                <Text style={s.detailLabel}>Payment Method</Text>
                <Text style={s.detailValue}>{order.paymentMethod}</Text>
              </View>
            </View>

            {(order.riderName || isNewOrder) && (
              <View style={s.card}>
                <View style={s.cardHeader}>
                  <Ionicons name="bicycle-outline" size={18} color={Colors.textPrimary} />
                  <Text style={s.cardTitle}>Rider Details</Text>
                </View>
                {order.riderName ? (
                  <>
                    <View style={s.detailRow}>
                      <Text style={s.detailLabel}>Name</Text>
                      <Text style={s.detailValue}>{order.riderName}</Text>
                    </View>
                    <View style={s.detailRow}>
                      <Text style={s.detailLabel}>Phone</Text>
                      <View style={s.phoneRow}>
                        <Text style={s.detailValue}>{order.riderPhone}</Text>
                        {!!order.riderPhone && (
                          <TouchableOpacity onPress={() => Linking.openURL(`tel:${order.riderPhone}`)}>
                            <Ionicons name="call" size={16} color={Colors.successGreen} style={{ marginLeft: 6 }} />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </>
                ) : (
                  <Text style={s.emptyRiderText}>Waiting for rider to accept</Text>
                )}
              </View>
            )}

            {order.services && order.services.length > 0 && (
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

            {(order.note !== undefined && order.note !== '') && (
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

          {showAction && (isNewOrder && onDecline ? (
            <View style={s.newOrderButtons}>
              <TouchableOpacity
                style={s.declineBtn}
                onPress={onDecline}
                activeOpacity={0.8}
              >
                <Text style={s.declineBtnText}>Decline</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.actionBtn, s.actionBtnFlex, actionLoading && s.actionBtnDisabled]}
                onPress={onAction}
                activeOpacity={0.8}
                disabled={actionLoading}
              >
                <Text style={s.actionBtnText}>{actionLoading ? 'Processing...' : 'Accept'}</Text>
                {!actionLoading && <Ionicons name="arrow-forward" size={20} color={Colors.white} />}
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[s.actionBtn, actionLoading && s.actionBtnDisabled]}
              onPress={onAction}
              activeOpacity={0.8}
              disabled={actionLoading}
            >
              <Text style={s.actionBtnText}>{actionLoading ? 'Processing...' : actionLabel}</Text>
              {!actionLoading && <Ionicons name="arrow-forward" size={20} color={Colors.white} />}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
  },
  overlayTouch: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: Dimensions.get('window').height * 0.9,
    height: '90%',
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
  statusNew: { backgroundColor: Colors.primaryBlue },
  statusWait: { backgroundColor: '#f59e0b' },
  statusWashing: { backgroundColor: Colors.primaryBlue },
  statusInProgress: { backgroundColor: '#f59e0b' },
  statusReady: { backgroundColor: Colors.successGreen },
  statusCompleted: { backgroundColor: '#6b7280' },
  statusText: { fontSize: 12, fontWeight: '700', color: Colors.white },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  paymentBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: Colors.successGreen,
  },
  paymentBadgeText: { fontSize: 12, fontWeight: '600', color: Colors.white },
  content: { flex: 1, minHeight: 0 },
  contentContainer: {
    padding: 20,
    paddingBottom: 80,
  },
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
  phoneRow: { flexDirection: 'row', alignItems: 'center' },
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
  actionBtnFlex: { flex: 1, margin: 0 },
  actionBtnText: { fontSize: 16, fontWeight: '700', color: Colors.white },
  actionBtnDisabled: { opacity: 0.7 },
  newOrderButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 8,
  },
  declineBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.primaryBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineBtnText: { fontSize: 16, fontWeight: '700', color: Colors.primaryBlue },
  emptyRiderText: { fontSize: 14, color: Colors.textMuted, paddingVertical: 8 },
});

import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Modal,
    Platform,
    useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useDelivery } from '../../context/DeliveryContext';
import type { Order, ReadyForPickupOrder } from '../../context/DeliveryContext';

function formatMoney(n: number) {
    return `${n.toFixed(2)}฿`;
}

/** ได้วันที่จาก order (completedAt หรือ updatedAt/createdAt) */
function getOrderDate(o: Order & { completedAt?: string }): Date | null {
    const raw = o.completedAt ?? (o as any).updatedAt ?? (o as any).createdAt;
    if (!raw) return null;
    const d = typeof raw === 'string' ? new Date(raw) : new Date(raw);
    return isNaN(d.getTime()) ? null : d;
}

/** เริ่มต้นสัปดาห์ (จันทร์) */
function getWeekStart(d: Date): Date {
    const x = new Date(d);
    const day = x.getDay();
    const diff = day === 0 ? -6 : 1 - day; // จันทร์ = 1
    x.setDate(x.getDate() + diff);
    x.setHours(0, 0, 0, 0);
    return x;
}

/** เริ่มต้นเดือน */
function getMonthStart(d: Date): Date {
    const x = new Date(d.getFullYear(), d.getMonth(), 1);
    return x;
}

/** อยู่ในวันเดียวกัน (local) */
function isSameDay(a: Date, b: Date): boolean {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}

/** อยู่ในสัปดาห์เดียวกัน (จันทร์-อาทิตย์) */
function isSameWeek(orderDate: Date, weekStart: Date): boolean {
    const ws = getWeekStart(weekStart);
    const orderWeekStart = getWeekStart(orderDate);
    return ws.getTime() === orderWeekStart.getTime();
}

/** อยู่ในเดือนเดียวกัน */
function isSameMonth(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

/** วันก่อนหน้า (เมื่อวาน) */
function isYesterday(a: Date, relativeTo: Date): boolean {
    const y = new Date(relativeTo);
    y.setDate(y.getDate() - 1);
    return isSameDay(a, y);
}

/** ข้อความช่วงวัน เช่น "Today (Mar 5)" / "Yesterday (Mar 4)" / "Mar 3" */
function formatDayLabel(d: Date, isToday: boolean, isYesterdayVal: boolean): string {
    const mon = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
    ][d.getMonth()];
    const day = d.getDate();
    const suffix = `(${mon} ${day})`;
    if (isToday) return `Today ${suffix}`;
    if (isYesterdayVal) return `Yesterday ${suffix}`;
    return `${mon} ${day}`;
}

/** สัปดาห์นี้ หรือ สัปดาห์ก่อน */
function isCurrentWeek(weekStart: Date, now: Date): boolean {
    return getWeekStart(weekStart).getTime() === getWeekStart(now).getTime();
}
function isLastWeek(weekStart: Date, now: Date): boolean {
    const thisWeekStart = getWeekStart(now);
    const prevWeekStart = new Date(thisWeekStart);
    prevWeekStart.setDate(prevWeekStart.getDate() - 7);
    return getWeekStart(weekStart).getTime() === prevWeekStart.getTime();
}

/** ข้อความช่วงสัปดาห์ เช่น "This Week (Mar 3 – Mar 9)" / "Last Week (Mar 3 – Mar 9)" */
function formatWeekLabel(weekStart: Date, now: Date): string {
    const mon = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
    ];
    const end = new Date(weekStart);
    end.setDate(end.getDate() + 6);
    const range = `${mon[weekStart.getMonth()]} ${weekStart.getDate()} – ${mon[end.getMonth()]} ${end.getDate()}`;
    if (isCurrentWeek(weekStart, now)) return `This Week (${range})`;
    if (isLastWeek(weekStart, now)) return `Last Week (${range})`;
    return range;
}

/** เดือนนี้ หรือ เดือนก่อน */
function isCurrentMonth(d: Date, now: Date): boolean {
    return isSameMonth(d, now);
}
function isLastMonth(d: Date, now: Date): boolean {
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return isSameMonth(d, prev);
}

/** ข้อความช่วงเดือน เช่น "This Month (Mar 1 – Mar 31)" / "Last Month (Feb 1 – Feb 28)" */
function formatMonthLabel(d: Date, now: Date): string {
    const mon = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
    ][d.getMonth()];
    const last = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    const range = `${mon} 1 – ${mon} ${last.getDate()}`;
    if (isCurrentMonth(d, now)) return `This Month (${range})`;
    if (isLastMonth(d, now)) return `Last Month (${range})`;
    return range;
}

/** วันที่แบบ พ.ศ. เช่น 27/02/2569 BE, 17:13:51 */
function formatTimeBE(iso: string) {
    const d = new Date(iso);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear() + 543;
    const [h, m, s] = d.toTimeString().slice(0, 8).split(':');
    return `${day}/${month}/${year} BE, ${h}:${m}:${s}`;
}

function paymentLabel(shopType?: string, paymentMethod?: string): string {
    if (shopType === 'coin') return 'Coin';
    if (shopType === 'full') return 'Full';
    if (paymentMethod === 'wallet') return 'Coin';
    if (paymentMethod === 'cash') return 'Full';
    if (paymentMethod === 'card') return 'Full';
    return 'Full';
}

function OrderRow({
    o,
    showDate = true,
}: {
    o: Order & { completedAt?: string };
    showDate?: boolean;
}) {
    const raw = o.completedAt ?? (o as any).updatedAt ?? (o as any).createdAt;
    const dateStr = raw
        ? formatTimeBE(typeof raw === 'string' ? raw : new Date(raw).toISOString())
        : '';
    return (
        <View style={s.item}>
            <View style={{ flex: 1 }}>
                <Text style={s.itemTitle}>{o.shopName}</Text>
                <Text style={s.itemSub}>{o.customerName}</Text>
                {showDate && dateStr ? <Text style={s.itemTime}>{dateStr}</Text> : null}
            </View>
            <View style={s.itemRight}>
                <View style={s.paymentPill}>
                    <Text style={s.paymentPillText}>
                        {paymentLabel((o as any).shopType, (o as any).paymentMethod)}
                    </Text>
                </View>
                <Text style={s.itemFee}>{formatMoney(o.fee)}</Text>
            </View>
        </View>
    );
}

const todayStart = () => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
};

export default function EarningScreen() {
    const router = useRouter();
    const { width: screenWidth } = useWindowDimensions();
    const tabBarHeight = useBottomTabBarHeight();
    const summaryBlockWidth = screenWidth - 32;

    const {
        history,
        readyForPickup,
        startPickupFromShop,
        active,
        atShopOrders,
        isOnline,
        hideCompletedOnEarningPage,
    } = useDelivery();
    const [selectedReadyOrder, setSelectedReadyOrder] = useState<ReadyForPickupOrder | null>(null);

    const [dayCursor, setDayCursor] = useState<Date>(todayStart);
    const [weekCursor, setWeekCursor] = useState<Date>(() => getWeekStart(new Date()));
    const [monthCursor, setMonthCursor] = useState<Date>(() => getMonthStart(new Date()));

    const { dailyStats, weeklyStats, monthlyStats } = useMemo(() => {
        const dayOrders = history.filter((o) => {
            const od = getOrderDate(o);
            return od && isSameDay(od, dayCursor);
        });
        const weekOrders = history.filter((o) => {
            const od = getOrderDate(o);
            return od && isSameWeek(od, weekCursor);
        });
        const monthOrders = history.filter((o) => {
            const od = getOrderDate(o);
            return od && isSameMonth(od, monthCursor);
        });
        return {
            dailyStats: {
                orders: dayOrders.length,
                earnings: dayOrders.reduce((s, o) => s + o.fee, 0),
            },
            weeklyStats: {
                orders: weekOrders.length,
                earnings: weekOrders.reduce((s, o) => s + o.fee, 0),
            },
            monthlyStats: {
                orders: monthOrders.length,
                earnings: monthOrders.reduce((s, o) => s + o.fee, 0),
            },
        };
    }, [history, dayCursor, weekCursor, monthCursor]);

    const hasReadyForPickup = readyForPickup.length > 0; // ผ้าซักเสร็จที่ร้าน รอไปรับ
    const hasInProgress = active !== null || atShopOrders.length > 0; // งานที่กำลังทำ หรือ ออเดอร์ที่ร้านกำลังซัก
    const hasHistory = history.length > 0;
    const showCompletedOnPage = isOnline && hasHistory && !hideCompletedOnEarningPage;

    const addDays = (d: Date, n: number) => {
        const x = new Date(d);
        x.setDate(x.getDate() + n);
        return x;
    };
    const addWeeks = (d: Date, n: number) => addDays(d, n * 7);
    const addMonths = (d: Date, n: number) => {
        const x = new Date(d);
        x.setMonth(x.getMonth() + n);
        return x;
    };

    const handleHeadToPickup = () => {
        if (!selectedReadyOrder) return;
        startPickupFromShop(selectedReadyOrder);
        setSelectedReadyOrder(null);
        router.push('/job');
    };

    return (
        <ScrollView
            style={s.container}
            contentContainerStyle={{ padding: 16, paddingBottom: tabBarHeight + 28 }}
            showsVerticalScrollIndicator={false}
        >
            <View style={s.header}>
                <Text style={s.title}>Earning</Text>
            </View>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.summaryScrollContent}
                style={s.summaryScroll}
            >
                {/* บล็อกรายวัน */}
                <View style={[s.summaryBlock, s.summaryBlockDay, { width: summaryBlockWidth }]}>
                    <View style={s.summaryBlockTop}>
                        <View style={[s.summaryBlockBadge, s.summaryBlockBadgeDay]}>
                            <Ionicons name="today-outline" size={14} color="#0EA5E9" />
                            <Text style={[s.summaryBlockBadgeText, s.summaryBlockBadgeTextDay]}>
                                Daily
                            </Text>
                        </View>
                        <View style={s.summaryBlockArrows}>
                            <TouchableOpacity
                                onPress={() => setDayCursor((d) => addDays(d, -1))}
                                style={s.arrowBtn}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="chevron-back" size={18} color="#0EA5E9" />
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setDayCursor((d) => addDays(d, 1))}
                                style={s.arrowBtn}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="chevron-forward" size={18} color="#0EA5E9" />
                            </TouchableOpacity>
                        </View>
                    </View>
                    <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() =>
                            router.push({
                                pathname: '/earning-history',
                                params: {
                                    period: 'day',
                                    date: dayCursor.toISOString(),
                                    periodLabel: formatDayLabel(
                                        dayCursor,
                                        isSameDay(dayCursor, new Date()),
                                        isYesterday(dayCursor, new Date())
                                    ),
                                },
                            })
                        }
                    >
                        <Text style={s.summaryBlockPeriod} numberOfLines={1}>
                            {formatDayLabel(
                                dayCursor,
                                isSameDay(dayCursor, new Date()),
                                isYesterday(dayCursor, new Date())
                            )}
                        </Text>
                        <View style={s.summaryBlockStats}>
                            <View style={[s.summaryBlockStatRow, s.summaryBlockStatRowFirst]}>
                                <Ionicons name="receipt-outline" size={16} color="#94A3B8" />
                                <Text style={s.summaryBlockStatLabel}>Orders</Text>
                                <Text style={s.summaryBlockStatValue}>{dailyStats.orders}</Text>
                            </View>
                            <View style={s.summaryBlockStatRow}>
                                <Ionicons name="cash-outline" size={16} color="#94A3B8" />
                                <Text style={s.summaryBlockStatLabel}>Earnings</Text>
                                <Text style={[s.summaryBlockStatValue, s.summaryBlockEarnings]}>
                                    {formatMoney(dailyStats.earnings)}
                                </Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={s.viewDetailRow}
                        activeOpacity={0.7}
                        onPress={() =>
                            router.push({
                                pathname: '/earning-history',
                                params: {
                                    period: 'day',
                                    date: dayCursor.toISOString(),
                                    periodLabel: formatDayLabel(
                                        dayCursor,
                                        isSameDay(dayCursor, new Date()),
                                        isYesterday(dayCursor, new Date())
                                    ),
                                },
                            })
                        }
                    >
                        <Text style={[s.viewDetailText, s.viewDetailTextDay]}>
                            View detail history
                        </Text>
                        <Ionicons name="chevron-forward" size={16} color="#0EA5E9" />
                    </TouchableOpacity>
                </View>

                {/* บล็อกรายสัปดาห์ */}
                <View style={[s.summaryBlock, s.summaryBlockWeek, { width: summaryBlockWidth }]}>
                    <View style={s.summaryBlockTop}>
                        <View style={[s.summaryBlockBadge, s.summaryBlockBadgeWeek]}>
                            <Ionicons name="calendar-outline" size={14} color="#8B5CF6" />
                            <Text style={[s.summaryBlockBadgeText, s.summaryBlockBadgeTextWeek]}>
                                Week
                            </Text>
                        </View>
                        <View style={s.summaryBlockArrows}>
                            <TouchableOpacity
                                onPress={() => setWeekCursor((d) => addWeeks(d, -1))}
                                style={s.arrowBtn}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="chevron-back" size={18} color="#8B5CF6" />
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setWeekCursor((d) => addWeeks(d, 1))}
                                style={s.arrowBtn}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="chevron-forward" size={18} color="#8B5CF6" />
                            </TouchableOpacity>
                        </View>
                    </View>
                    <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() =>
                            router.push({
                                pathname: '/earning-history',
                                params: {
                                    period: 'week',
                                    date: weekCursor.toISOString(),
                                    periodLabel: formatWeekLabel(weekCursor, new Date()),
                                },
                            })
                        }
                    >
                        <Text style={s.summaryBlockPeriod} numberOfLines={1}>
                            {formatWeekLabel(weekCursor, new Date())}
                        </Text>
                        <View style={s.summaryBlockStats}>
                            <View style={[s.summaryBlockStatRow, s.summaryBlockStatRowFirst]}>
                                <Ionicons name="receipt-outline" size={16} color="#94A3B8" />
                                <Text style={s.summaryBlockStatLabel}>Orders</Text>
                                <Text style={s.summaryBlockStatValue}>{weeklyStats.orders}</Text>
                            </View>
                            <View style={s.summaryBlockStatRow}>
                                <Ionicons name="cash-outline" size={16} color="#94A3B8" />
                                <Text style={s.summaryBlockStatLabel}>Earnings</Text>
                                <Text style={[s.summaryBlockStatValue, s.summaryBlockEarnings]}>
                                    {formatMoney(weeklyStats.earnings)}
                                </Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={s.viewDetailRow}
                        activeOpacity={0.7}
                        onPress={() =>
                            router.push({
                                pathname: '/earning-history',
                                params: {
                                    period: 'week',
                                    date: weekCursor.toISOString(),
                                    periodLabel: formatWeekLabel(weekCursor, new Date()),
                                },
                            })
                        }
                    >
                        <Text style={[s.viewDetailText, s.viewDetailTextWeek]}>
                            View detail history
                        </Text>
                        <Ionicons name="chevron-forward" size={16} color="#8B5CF6" />
                    </TouchableOpacity>
                </View>

                {/* บล็อกรายเดือน */}
                <View style={[s.summaryBlock, s.summaryBlockMonth, { width: summaryBlockWidth }]}>
                    <View style={s.summaryBlockTop}>
                        <View style={[s.summaryBlockBadge, s.summaryBlockBadgeMonth]}>
                            <Ionicons name="calendar" size={14} color="#10B981" />
                            <Text style={[s.summaryBlockBadgeText, s.summaryBlockBadgeTextMonth]}>
                                Month
                            </Text>
                        </View>
                        <View style={s.summaryBlockArrows}>
                            <TouchableOpacity
                                onPress={() => setMonthCursor((d) => addMonths(d, -1))}
                                style={s.arrowBtn}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="chevron-back" size={18} color="#10B981" />
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setMonthCursor((d) => addMonths(d, 1))}
                                style={s.arrowBtn}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="chevron-forward" size={18} color="#10B981" />
                            </TouchableOpacity>
                        </View>
                    </View>
                    <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() =>
                            router.push({
                                pathname: '/earning-history',
                                params: {
                                    period: 'month',
                                    date: monthCursor.toISOString(),
                                    periodLabel: formatMonthLabel(monthCursor, new Date()),
                                },
                            })
                        }
                    >
                        <Text style={s.summaryBlockPeriod} numberOfLines={1}>
                            {formatMonthLabel(monthCursor, new Date())}
                        </Text>
                        <View style={s.summaryBlockStats}>
                            <View style={[s.summaryBlockStatRow, s.summaryBlockStatRowFirst]}>
                                <Ionicons name="receipt-outline" size={16} color="#94A3B8" />
                                <Text style={s.summaryBlockStatLabel}>Orders</Text>
                                <Text style={s.summaryBlockStatValue}>{monthlyStats.orders}</Text>
                            </View>
                            <View style={s.summaryBlockStatRow}>
                                <Ionicons name="cash-outline" size={16} color="#94A3B8" />
                                <Text style={s.summaryBlockStatLabel}>Earnings</Text>
                                <Text style={[s.summaryBlockStatValue, s.summaryBlockEarnings]}>
                                    {formatMoney(monthlyStats.earnings)}
                                </Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={s.viewDetailRow}
                        activeOpacity={0.7}
                        onPress={() =>
                            router.push({
                                pathname: '/earning-history',
                                params: {
                                    period: 'month',
                                    date: monthCursor.toISOString(),
                                    periodLabel: formatMonthLabel(monthCursor, new Date()),
                                },
                            })
                        }
                    >
                        <Text style={[s.viewDetailText, s.viewDetailTextMonth]}>
                            View detail history
                        </Text>
                        <Ionicons name="chevron-forward" size={16} color="#10B981" />
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {hasReadyForPickup && (
                <>
                    <View style={s.statusPillWrap}>
                        <View style={[s.statusPill, s.statusReady]}>
                            <Text style={s.statusPillText}>Ready for Pickup</Text>
                        </View>
                    </View>
                    {readyForPickup.map((o) => (
                        <TouchableOpacity
                            key={o.id}
                            activeOpacity={0.8}
                            onPress={() => setSelectedReadyOrder(o)}
                        >
                            <OrderRow o={o} showDate={!!(o as any).updatedAt} />
                        </TouchableOpacity>
                    ))}
                </>
            )}

            {hasInProgress && (
                <>
                    <View style={s.statusPillWrap}>
                        <View style={[s.statusPill, s.statusProgress]}>
                            <Text style={s.statusPillText}>In progress</Text>
                        </View>
                    </View>
                    {active && <OrderRow o={active} showDate={false} />}
                    {atShopOrders.map((o) => (
                        <OrderRow key={o.id} o={o} showDate={true} />
                    ))}
                </>
            )}

            {showCompletedOnPage && (
                <>
                    <View style={s.statusPillWrap}>
                        <View style={[s.statusPill, s.statusCompleted]}>
                            <Text style={s.statusPillText}>Completed</Text>
                        </View>
                    </View>
                    {history.map((o) => (
                        <OrderRow key={`${o.id}-${o.completedAt}`} o={o} />
                    ))}
                </>
            )}

            {!hasReadyForPickup && !hasInProgress && !showCompletedOnPage && (
                <View style={s.empty}>
                    <Text style={s.emptyTitle}>No active orders</Text>
                    <Text style={s.emptySub}>Tap a block above to view detail history.</Text>
                </View>
            )}

            {/* Bottom Sheet รายละเอียดออเดอร์ Ready for Pickup */}
            <Modal
                transparent
                visible={!!selectedReadyOrder}
                animationType="slide"
                onRequestClose={() => setSelectedReadyOrder(null)}
            >
                <View style={s.sheetWrap}>
                    <TouchableOpacity
                        style={s.sheetOverlay}
                        activeOpacity={1}
                        onPress={() => setSelectedReadyOrder(null)}
                    />
                    {selectedReadyOrder && (
                        <View style={s.bottomSheet}>
                            <View style={s.sheetHandleWrap}>
                                <View style={s.sheetHandle} />
                            </View>
                            <View style={s.sheetHeader}>
                                <Text style={s.sheetOrderId}>
                                    {selectedReadyOrder.orderId ||
                                        `ORD-${String(selectedReadyOrder.id).slice(-4)}`}
                                </Text>
                                <View style={s.sheetBadgeWashing}>
                                    <Text style={s.sheetBadgeText}>WASHING</Text>
                                </View>
                                <View style={s.sheetPaymentBadge}>
                                    <Text style={s.sheetPaymentBadgeText}>
                                        {selectedReadyOrder.paymentLabel ||
                                            (selectedReadyOrder.paymentMethod === 'wallet'
                                                ? 'Wallet'
                                                : 'เงินสด')}
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    onPress={() => setSelectedReadyOrder(null)}
                                    hitSlop={12}
                                    style={s.sheetCloseBtn}
                                >
                                    <Ionicons name="close" size={24} color="#333" />
                                </TouchableOpacity>
                            </View>

                            <ScrollView
                                style={s.sheetScroll}
                                showsVerticalScrollIndicator={false}
                                bounces={false}
                            >
                                <View style={s.sheetTotalCard}>
                                    <Text style={s.sheetTotalLabel}>Total Amount</Text>
                                    <Text style={s.sheetTotalValue}>
                                        {Number(
                                            selectedReadyOrder.total ?? selectedReadyOrder.fee ?? 0
                                        ).toFixed(2)}
                                        ฿
                                    </Text>
                                    <View style={s.sheetUnpaidRow}>
                                        <Ionicons
                                            name="calendar-outline"
                                            size={14}
                                            color="rgba(255,255,255,0.85)"
                                        />
                                        <Text style={s.sheetUnpaid}>Unpaid</Text>
                                    </View>
                                </View>

                                <View style={s.sheetCard}>
                                    <View style={s.sheetCardTitleRow}>
                                        <Ionicons name="person-outline" size={18} color="#334155" />
                                        <Text style={s.sheetCardTitle}>Customer Details</Text>
                                    </View>
                                    <View style={s.sheetDetailRow}>
                                        <Text style={s.sheetDetailLabel}>Name</Text>
                                        <Text style={s.sheetDetailValue}>
                                            {selectedReadyOrder.customerName}
                                        </Text>
                                    </View>
                                    {!!selectedReadyOrder.customerPhone && (
                                        <View style={s.sheetDetailRow}>
                                            <Text style={s.sheetDetailLabel}>Phone</Text>
                                            <Text style={s.sheetDetailValue}>
                                                {selectedReadyOrder.customerPhone}
                                            </Text>
                                        </View>
                                    )}
                                    <View style={s.sheetDetailRow}>
                                        <Text style={s.sheetDetailLabel}>Order Date</Text>
                                        <Text style={s.sheetDetailValue}>
                                            Today, 2:00 PM - 4:00 PM
                                        </Text>
                                    </View>
                                </View>

                                <View style={s.sheetCard}>
                                    <View style={s.sheetCardTitleRow}>
                                        <Ionicons name="person-outline" size={18} color="#334155" />
                                        <Text style={s.sheetCardTitle}>Merchant Details</Text>
                                    </View>
                                    <View style={s.sheetDetailRow}>
                                        <Text style={s.sheetDetailLabel}>Name</Text>
                                        <Text style={s.sheetDetailValue}>
                                            {selectedReadyOrder.shopName}
                                        </Text>
                                    </View>
                                    {!!selectedReadyOrder.shopPhone && (
                                        <View style={s.sheetDetailRow}>
                                            <Text style={s.sheetDetailLabel}>Phone</Text>
                                            <Text style={s.sheetDetailValue}>
                                                {selectedReadyOrder.shopPhone}
                                            </Text>
                                        </View>
                                    )}
                                </View>

                                <View style={s.sheetCard}>
                                    <View style={s.sheetCardTitleRow}>
                                        <Ionicons name="list-outline" size={18} color="#334155" />
                                        <Text style={s.sheetCardTitle}>Service List</Text>
                                    </View>
                                    {selectedReadyOrder.itemsList &&
                                    selectedReadyOrder.itemsList.length > 0 ? (
                                        selectedReadyOrder.itemsList.map((item, i) => {
                                            const qty = selectedReadyOrder.items ?? 1;
                                            const subtotal =
                                                item.price * (typeof qty === 'number' ? qty : 1);
                                            return (
                                                <View key={i} style={s.sheetServiceItem}>
                                                    <View style={s.sheetServiceIcon}>
                                                        <Ionicons
                                                            name="shirt-outline"
                                                            size={20}
                                                            color="#3B82F6"
                                                        />
                                                    </View>
                                                    <View style={s.sheetServiceContent}>
                                                        <Text style={s.sheetServiceName}>
                                                            {item.name}
                                                        </Text>
                                                        <Text style={s.sheetServiceDetail}>
                                                            {item.details ||
                                                                `${qty} kg x ฿${item.price}`}
                                                        </Text>
                                                    </View>
                                                    <Text style={s.sheetServicePrice}>
                                                        ฿{subtotal}
                                                    </Text>
                                                </View>
                                            );
                                        })
                                    ) : (
                                        <View style={s.sheetServiceItem}>
                                            <View style={s.sheetServiceIcon}>
                                                <Ionicons
                                                    name="shirt-outline"
                                                    size={20}
                                                    color="#3B82F6"
                                                />
                                            </View>
                                            <View style={s.sheetServiceContent}>
                                                <Text style={s.sheetServiceName}>
                                                    Washing & Folding
                                                </Text>
                                                <Text style={s.sheetServiceDetail}>
                                                    {selectedReadyOrder.items ?? 0} kg x ฿40
                                                </Text>
                                            </View>
                                            <Text style={s.sheetServicePrice}>
                                                ฿
                                                {Number(
                                                    selectedReadyOrder.total ??
                                                        selectedReadyOrder.fee ??
                                                        0
                                                ).toFixed(0)}
                                            </Text>
                                        </View>
                                    )}
                                </View>

                                <View style={s.sheetCard}>
                                    <View style={s.sheetCardTitleRow}>
                                        <Ionicons
                                            name="document-text-outline"
                                            size={18}
                                            color="#334155"
                                        />
                                        <Text style={s.sheetCardTitle}>Note</Text>
                                    </View>
                                    <View style={s.sheetNoteBox}>
                                        <Text style={s.sheetNoteText}>
                                            {selectedReadyOrder.note || '—'}
                                        </Text>
                                    </View>
                                </View>
                            </ScrollView>

                            <TouchableOpacity
                                style={s.sheetBtnHeadToPickup}
                                onPress={handleHeadToPickup}
                            >
                                <Text style={s.sheetBtnHeadToPickupText}>Head to Pickup</Text>
                                <Ionicons
                                    name="arrow-forward"
                                    size={20}
                                    color="#fff"
                                    style={{ marginLeft: 8 }}
                                />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </Modal>
        </ScrollView>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F1F5F9' },
    header: { marginBottom: 16 },
    title: { fontSize: 26, fontWeight: '900', color: '#0F172A', letterSpacing: -0.5 },

    summaryScroll: { marginHorizontal: -16, marginBottom: 20 },
    summaryScrollContent: { paddingHorizontal: 16, flexDirection: 'row', paddingVertical: 6 },
    summaryBlock: {
        marginRight: 14,
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 18,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.06)',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.06,
                shadowRadius: 12,
            },
            android: { elevation: 4 },
        }),
    },
    summaryBlockDay: { borderLeftWidth: 4, borderLeftColor: '#0EA5E9' },
    summaryBlockWeek: { borderLeftWidth: 4, borderLeftColor: '#8B5CF6' },
    summaryBlockMonth: { borderLeftWidth: 4, borderLeftColor: '#10B981' },
    summaryBlockTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    summaryBlockBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 999,
        gap: 6,
    },
    summaryBlockBadgeDay: { backgroundColor: 'rgba(14, 165, 233, 0.12)' },
    summaryBlockBadgeWeek: { backgroundColor: 'rgba(139, 92, 246, 0.12)' },
    summaryBlockBadgeMonth: { backgroundColor: 'rgba(16, 185, 129, 0.12)' },
    summaryBlockBadgeText: { fontSize: 12, fontWeight: '800' },
    summaryBlockBadgeTextDay: { color: '#0EA5E9' },
    summaryBlockBadgeTextWeek: { color: '#8B5CF6' },
    summaryBlockBadgeTextMonth: { color: '#10B981' },
    summaryBlockArrows: { flexDirection: 'row', alignItems: 'center' },
    arrowBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(0,0,0,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 4,
    },
    summaryBlockPeriod: {
        fontSize: 15,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 14,
        letterSpacing: 0.2,
    },
    summaryBlockStats: {},
    summaryBlockStatRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    summaryBlockStatRowFirst: { marginTop: 0 },
    summaryBlockStatLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#64748B',
        flex: 1,
        marginLeft: 8,
    },
    summaryBlockStatValue: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
    summaryBlockEarnings: { color: '#10B981', fontWeight: '900' },

    viewDetailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 14,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.06)',
    },
    viewDetailText: { fontSize: 13, fontWeight: '700' },
    viewDetailTextDay: { color: '#0EA5E9' },
    viewDetailTextWeek: { color: '#8B5CF6' },
    viewDetailTextMonth: { color: '#10B981' },

    summaryBlockHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    summaryBlockLabel: { fontSize: 14, fontWeight: '800', color: '#0F172A', flex: 1 },
    summaryBlockMeta: { fontSize: 13, fontWeight: '700', color: '#64748B', marginTop: 4 },

    summaryRow: { flexDirection: 'row', gap: 12, marginBottom: 14 },
    card: { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 14, elevation: 2 },
    cardLabel: { color: '#64748B', fontWeight: '800', fontSize: 12 },
    cardValue: { color: '#0F172A', fontWeight: '900', fontSize: 18, marginTop: 6 },

    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 6,
        marginBottom: 10,
    },
    sectionTitle: { fontSize: 16, fontWeight: '900', color: '#0F172A' },

    statusPillWrap: { marginTop: 14, marginBottom: 8 },
    statusPill: {
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
    },
    statusPillText: { fontSize: 12, fontWeight: '800', color: '#fff' },
    statusReady: { backgroundColor: '#22C55E' },
    statusProgress: { backgroundColor: '#EAB308' },
    statusCompleted: { backgroundColor: '#64748B' },

    item: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 10,
        elevation: 1,
    },
    itemTitle: { fontSize: 14, fontWeight: '900', color: '#0F172A' },
    itemSub: { fontSize: 12, fontWeight: '700', color: '#64748B', marginTop: 2 },
    itemTime: { fontSize: 11, fontWeight: '700', color: '#94A3B8', marginTop: 6 },
    itemRight: { alignItems: 'flex-end', gap: 6 },
    paymentPill: {
        backgroundColor: '#3B82F6',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
    },
    paymentPillText: { fontSize: 11, fontWeight: '800', color: '#fff' },
    itemFee: { fontSize: 14, fontWeight: '900', color: '#0F172A' },

    empty: { backgroundColor: '#fff', borderRadius: 16, padding: 16, elevation: 1 },
    emptyTitle: { fontSize: 14, fontWeight: '900', color: '#0F172A' },
    emptySub: { fontSize: 12, fontWeight: '700', color: '#64748B', marginTop: 6 },

    sheetWrap: { flex: 1, justifyContent: 'flex-end' },
    sheetOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
    bottomSheet: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '90%',
        paddingHorizontal: 20,
        paddingBottom: 28,
        elevation: 10,
    },
    sheetHandleWrap: { alignItems: 'center', paddingTop: 12, paddingBottom: 4 },
    sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0' },
    sheetHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
    },
    sheetOrderId: { fontSize: 18, fontWeight: '900', color: '#0F172A' },
    sheetBadgeWashing: {
        backgroundColor: '#3B82F6',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
    },
    sheetBadgeText: { color: '#fff', fontSize: 12, fontWeight: '800' },
    sheetPaymentBadge: {
        backgroundColor: '#22C55E',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
    },
    sheetPaymentBadgeText: { color: '#fff', fontSize: 12, fontWeight: '800' },
    sheetCloseBtn: { marginLeft: 'auto' },
    sheetScroll: { maxHeight: 400 },
    sheetTotalCard: { backgroundColor: '#3B82F6', borderRadius: 16, padding: 18, marginBottom: 14 },
    sheetTotalLabel: { color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: '800' },
    sheetTotalValue: { color: '#fff', fontSize: 26, fontWeight: '900', marginTop: 6 },
    sheetUnpaidRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 6 },
    sheetUnpaid: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '700' },
    sheetCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 14,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    sheetCardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    sheetCardTitle: { fontSize: 15, fontWeight: '900', color: '#0F172A' },
    sheetDetailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    sheetDetailLabel: { fontSize: 13, color: '#64748B', fontWeight: '700' },
    sheetDetailValue: { fontSize: 13, color: '#0F172A', fontWeight: '800' },
    sheetServiceItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    sheetServiceIcon: {
        width: 44,
        height: 44,
        borderRadius: 10,
        backgroundColor: '#EFF6FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    sheetServiceContent: { flex: 1 },
    sheetServiceName: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
    sheetServiceDetail: { fontSize: 12, color: '#64748B', marginTop: 2, fontWeight: '700' },
    sheetServicePrice: { fontSize: 14, fontWeight: '900', color: '#0F172A' },
    sheetNoteBox: {
        backgroundColor: '#F8FAFC',
        borderRadius: 10,
        padding: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    sheetNoteText: { fontSize: 13, color: '#64748B', fontWeight: '700' },
    sheetBtnHeadToPickup: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#3B82F6',
        paddingVertical: 16,
        borderRadius: 14,
        marginTop: 8,
    },
    sheetBtnHeadToPickupText: { color: '#fff', fontWeight: '900', fontSize: 16 },
});

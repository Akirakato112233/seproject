import type { Order } from "../context/DeliveryContext";

export type PeriodType = "day" | "week" | "month";

/** ได้วันที่จาก order (completedAt หรือ updatedAt/createdAt) */
export function getOrderDate(o: Order & { completedAt?: string }): Date | null {
  const raw = o.completedAt ?? (o as any).updatedAt ?? (o as any).createdAt;
  if (!raw) return null;
  const d = typeof raw === "string" ? new Date(raw) : new Date(raw);
  return isNaN(d.getTime()) ? null : d;
}

/** เริ่มต้นสัปดาห์ (จันทร์) */
export function getWeekStart(d: Date): Date {
  const x = new Date(d);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** อยู่ในวันเดียวกัน (local) */
export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** อยู่ในสัปดาห์เดียวกัน */
export function isSameWeek(orderDate: Date, weekStart: Date): boolean {
  const ws = getWeekStart(weekStart);
  const orderWeekStart = getWeekStart(orderDate);
  return ws.getTime() === orderWeekStart.getTime();
}

/** อยู่ในเดือนเดียวกัน */
export function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

/** กรอง history ตามช่วง period + cursor */
export function filterHistoryByPeriod(
  history: (Order & { completedAt?: string })[],
  period: PeriodType,
  cursor: Date
): (Order & { completedAt?: string })[] {
  return history.filter((o) => {
    const od = getOrderDate(o);
    if (!od) return false;
    if (period === "day") return isSameDay(od, cursor);
    if (period === "week") return isSameWeek(od, cursor);
    if (period === "month") return isSameMonth(od, cursor);
    return false;
  });
}

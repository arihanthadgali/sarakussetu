import type { BadgeTone } from '@/components/ui';

type KnownOrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'READY' | 'COMPLETED' | 'CANCELLED';
type OrderStatusPresentation = { label: string; note: string };

export const orderStatusPresentation: Record<KnownOrderStatus, OrderStatusPresentation> = {
  PENDING: { label: 'Order received', note: 'Awaiting confirmation' }, CONFIRMED: { label: 'Confirmed', note: 'Your order is confirmed' }, PROCESSING: { label: 'Being prepared', note: 'Wholesaler is preparing items' }, READY: { label: 'Ready', note: 'Ready for delivery' }, COMPLETED: { label: 'Completed', note: 'Order completed' }, CANCELLED: { label: 'Cancelled', note: 'Order cancelled' },
};

export function getOrderStatusPresentation(status: string): OrderStatusPresentation {
  return orderStatusPresentation[status as KnownOrderStatus] ?? { label: 'Status update', note: status.replace(/_/g, ' ') };
}

export function getOrderStatusTone(status: string): BadgeTone {
  if (status === 'CANCELLED') return 'danger';
  if (status === 'COMPLETED') return 'success';
  return 'warning';
}

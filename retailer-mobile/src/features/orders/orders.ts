import { useQuery } from '@tanstack/react-query';

import { getOrder, getOrders, type RetailerOrder } from '@/api/orders';

export const ordersQueryKey = ['orders'] as const;
export const useOrders = () => useQuery({ queryKey: ordersQueryKey, queryFn: getOrders });
export const useOrder = (id: string) => useQuery({ queryKey: [...ordersQueryKey, id], queryFn: () => getOrder(id), enabled: /^\d+$/.test(id) });
export const activeOrder = (orders: RetailerOrder[] | undefined) => orders?.find((order) => !['COMPLETED', 'CANCELLED'].includes(order.status)) ?? null;

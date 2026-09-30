export interface AdminOrderItem {
  id: string;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface AdminOrder {
  id: string;
  status: string;
  deliveryStatus: DeliveryStatus;
  deliveryPersonName: string | null;
  deliveryPersonPhone: string | null;
  subtotal: number;
  createdAt: string;
  updatedAt: string;
  retailer: {
    id: string;
    phoneNumber: string;
  };
  wholesaler: {
    id: string;
    businessName: string;
  } | null;

  items: AdminOrderItem[];
}

export type DeliveryStatus =
  | "UNASSIGNED"
  | "ASSIGNED"
  | "PICKED_UP"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED";

export interface UpdateDeliveryResponse {
  id: string;
  status: string;
  deliveryStatus: DeliveryStatus;
  deliveryPersonName: string | null;
  deliveryPersonPhone: string | null;
  updatedAt: string;
}

export interface AdminWholesaler {
  id: string;
  businessName: string;
  ownerName: string;
  phoneNumber: string;
  city: string;
  pincode: string;
}

export interface AssignOrderResponse {
  id: string;
  status: string;
  wholesaler: {
    id: string;
    businessName: string;
  };
  subtotal: number;
  updatedAt: string;
}

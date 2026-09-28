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
  subtotal: number;
  createdAt: string;
  updatedAt: string;
  wholesalerId?: string | null;

  customer?: {
    id: string;
    phoneNumber: string;
  };

  retailer?: {
    id: string;
    phoneNumber: string;
  };

  items: AdminOrderItem[];
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
  wholesalerId: string;
}
export interface AdminProduct {
  id: number;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

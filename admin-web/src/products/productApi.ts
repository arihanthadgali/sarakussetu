import { apiRequest } from "../api/client";
import type { AdminProduct } from "./types";

export type ProductInput = {
  name: string;
  description: string | null;
  price: number;
  active: boolean;
};

export function getProducts(): Promise<AdminProduct[]> {
  return apiRequest<AdminProduct[]>("/api/admin/products", {
    authenticated: true,
  });
}

export function createProduct(input: ProductInput): Promise<AdminProduct> {
  return apiRequest<AdminProduct>("/api/admin/products", {
    method: "POST",
    authenticated: true,
    body: JSON.stringify(input),
  });
}

export function updateProduct(
  productId: number,
  input: Partial<ProductInput>,
): Promise<AdminProduct> {
  return apiRequest<AdminProduct>(`/api/admin/products/${productId}`, {
    method: "PATCH",
    authenticated: true,
    body: JSON.stringify(input),
  });
}

export function uploadProductImage(
  productId: number,
  file: File,
): Promise<AdminProduct> {
  const formData = new FormData();
  formData.append("image", file);

  return apiRequest<AdminProduct>(`/api/admin/products/${productId}/image`, {
    method: "POST",
    authenticated: true,
    body: formData,
  });
}

export function deleteProductImage(productId: number): Promise<AdminProduct> {
  return apiRequest<AdminProduct>(`/api/admin/products/${productId}/image`, {
    method: "DELETE",
    authenticated: true,
  });
}

export function resolveProductImageUrl(imageUrl: string | null): string | null {
  if (!imageUrl) {
    return null;
  }

  if (/^https?:\/\//i.test(imageUrl)) {
    return imageUrl;
  }

  const apiBaseUrl =
    import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

  return new URL(imageUrl, apiBaseUrl).toString();
}

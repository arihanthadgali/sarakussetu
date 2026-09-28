import { apiRequest } from "../api/client";
import type { Product } from "./types";

export async function getProducts(): Promise<Product[]> {
  return apiRequest<Product[]>("/api/products", {
    authenticated: false,
  });
}
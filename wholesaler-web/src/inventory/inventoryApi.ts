import { apiRequest } from "../api/client";
import type { WholesalerInventoryItem } from "./types";

export function getWholesalerInventory(): Promise<WholesalerInventoryItem[]> {
  return apiRequest<WholesalerInventoryItem[]>("/api/wholesaler/inventory", {
    authenticated: true,
  });
}

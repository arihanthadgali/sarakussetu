import { apiRequest } from "../api/client";
import type { AdminRetailer } from "./types";

export function getRetailers(): Promise<AdminRetailer[]> {
  return apiRequest<AdminRetailer[]>("/api/admin/retailers", {
    authenticated: true,
  });
}

import { apiRequest } from "../api/client";

export interface AdminProfile {
  id: string;
  name: string;
  phoneNumber: string;
  createdAt: string;
}

export const getAdminProfile = () => apiRequest<AdminProfile>("/api/admin/profile", { authenticated: true });

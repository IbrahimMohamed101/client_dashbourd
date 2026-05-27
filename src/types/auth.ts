import type { LoginSchemaType } from "@/lib/validations/loginSchema";

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  lastLoginAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  status: boolean;
  token: string;
  user: User | null;
}

export const UserRoles = {
  SUPERADMIN: "superadmin",
  ADMIN: "admin",
  KITCHEN: "kitchen",
  COURIER: "courier",
  CASHIER: "cashier",
} as const;

export type UserRole = (typeof UserRoles)[keyof typeof UserRoles];

export type LoginCredentials = LoginSchemaType;

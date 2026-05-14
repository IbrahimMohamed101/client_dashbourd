// ── §16 Shared Menu Identity Mapping Types ──
// These map items between the one-time order menu and the subscription menu.
// Admin-only — does NOT change the mobile menu.

import type { PaginatedResponse } from "./menuTypes";

// ── Shared Identity ──

export interface SharedMenuIdentity {
  id: string;
  key: string;
  type: string;
  name?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type SharedMenuIdentitiesResponse =
  PaginatedResponse<SharedMenuIdentity>;

export interface SharedMenuIdentityDetailResponse {
  status: boolean;
  data: SharedMenuIdentity;
}

// ── Identity Link ──

export type IdentityLinkChannel = "one_time" | "subscription";
export type IdentityLinkConfidence = "exact" | "alias" | "manual";
export type IdentityLinkStatus = "pending" | "confirmed" | "rejected";

export interface MenuIdentityLink {
  id: string;
  identityId: string;
  channel: IdentityLinkChannel;
  sourceModel: string;
  sourceId: string;
  confidence: IdentityLinkConfidence;
  status: IdentityLinkStatus;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type MenuIdentityLinksResponse = PaginatedResponse<MenuIdentityLink>;

export interface MenuIdentityLinksByIdentityResponse {
  status: boolean;
  data: MenuIdentityLink[];
}

// ── §17 Identity Suggestions ──

export type SuggestionStatus = "pending" | "approved" | "rejected";

export interface MenuIdentitySuggestion {
  id: string;
  type: string;
  sourceKey: string;
  targetKey: string;
  confidence: IdentityLinkConfidence;
  status: SuggestionStatus;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type MenuIdentitySuggestionsResponse =
  PaginatedResponse<MenuIdentitySuggestion>;

export interface MenuIdentitySuggestionDetailResponse {
  status: boolean;
  data: MenuIdentitySuggestion;
}

// ── Query Params ──

export interface MenuIdentityListParams {
  page?: number;
  limit?: number;
  key?: string;
  type?: string;
  isActive?: boolean;
}

export interface MenuIdentityLinkListParams {
  page?: number;
  limit?: number;
  channel?: IdentityLinkChannel;
  sourceModel?: string;
  confidence?: IdentityLinkConfidence;
  status?: IdentityLinkStatus;
  isActive?: boolean;
}

export interface MenuIdentitySuggestionListParams {
  page?: number;
  limit?: number;
  status?: SuggestionStatus;
  confidence?: IdentityLinkConfidence;
  type?: string;
}

// ── Action Payloads ──

export interface SuggestionActionPayload {
  notes?: string;
}

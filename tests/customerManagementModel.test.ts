import assert from "node:assert/strict";
import { test } from "vitest";

import {
  buildCustomerManagementUpdate,
  draftFromManagedCustomer,
  type ManagedCustomerProfile,
} from "../src/features/customer-management/customerManagementApi";

const profile: ManagedCustomerProfile = {
  id: "user-1",
  coreUserId: "user-1",
  appUserId: "app-user-1",
  fullName: "Original Customer",
  phone: "+966500000001",
  phoneE164: "+966500000001",
  email: "original@example.com",
  isActive: true,
  activeSubscription: {
    id: "subscription-1",
    displayId: "SUB-000001",
    status: "active",
    deliveryMode: "delivery",
    deliveryAddress: {
      line1: "Original address",
      city: "Riyadh",
      lat: 24.7136,
      lng: 46.6753,
    },
  },
  createdAt: null,
  updatedAt: null,
};

test("customer management draft does not create false address changes", () => {
  const draft = draftFromManagedCustomer(profile);
  assert.equal(buildCustomerManagementUpdate(profile, draft, "audit reason"), null);
});

test("customer management update normalizes identity and preserves coordinates", () => {
  const draft = draftFromManagedCustomer(profile);
  draft.fullName = "  Updated   Customer ";
  draft.phone = "0500000002";
  draft.email = " UPDATED@EXAMPLE.COM ";
  draft.deliveryAddress.line1 = "New address";

  assert.deepEqual(
    buildCustomerManagementUpdate(profile, draft, "  customer correction  "),
    {
      reason: "customer correction",
      fullName: "Updated Customer",
      phone: "+966500000002",
      email: "updated@example.com",
      deliveryAddress: {
        line1: "New address",
        city: "Riyadh",
        lat: 24.7136,
        lng: 46.6753,
      },
    }
  );
});

test("pickup subscriptions never submit an address mutation", () => {
  const pickupProfile: ManagedCustomerProfile = {
    ...profile,
    activeSubscription: {
      ...profile.activeSubscription!,
      deliveryMode: "pickup",
    },
  };
  const draft = draftFromManagedCustomer(pickupProfile);
  draft.deliveryAddress.line1 = "Must not be submitted";
  draft.isActive = false;

  assert.deepEqual(
    buildCustomerManagementUpdate(pickupProfile, draft, "account status correction"),
    { reason: "account status correction", isActive: false }
  );
});

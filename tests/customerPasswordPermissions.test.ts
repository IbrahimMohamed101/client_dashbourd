import { describe, expect, it } from "vitest";

import { canManageCustomerPasswords } from "../src/lib/rolePermissions";

describe("customer password permissions", () => {
  it("allows both cashier and restaurant to reset app customer passwords", () => {
    expect(canManageCustomerPasswords("restaurant")).toBe(true);
    expect(canManageCustomerPasswords("cashier")).toBe(true);
  });

  it("keeps kitchen and courier blocked", () => {
    expect(canManageCustomerPasswords("kitchen")).toBe(false);
    expect(canManageCustomerPasswords("courier")).toBe(false);
  });
});

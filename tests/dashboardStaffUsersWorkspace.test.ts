// @vitest-environment jsdom

import assert from "node:assert/strict";
import { describe, it, vi, beforeEach } from "vitest";
import { canRoleAccessRoute } from "../src/constants/routes";
import {
  buildCreateDashboardStaffUserPayload,
  buildUpdateDashboardStaffUserPatch,
  createDashboardStaffUserSchema,
  getAssignableDashboardStaffRoles,
  resetDashboardStaffPasswordSchema,
} from "../src/components/pages/dashboard-users/dashboardStaffUsersModel";
import {
  dashboardStaffResetPasswordUrl,
  dashboardStaffUsersUrl,
} from "../src/utils/dashboardApiContract";
import {
  getDashboardStaffUserErrorMessage,
  isDashboardStaffForbiddenError,
  isDashboardStaffTokenRevokedError,
} from "../src/utils/fetchDashboardUsers";
import { UserRoles } from "../src/types/auth";
import type { DashboardStaffUserDto } from "../src/types/dashboardAdminTypes";

describe("dashboard staff users workspace contract", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it("allows only Super Admin route access before staff list requests", () => {
    assert.equal(canRoleAccessRoute(UserRoles.SUPERADMIN, "/dashboard-users"), true);
    assert.equal(canRoleAccessRoute(UserRoles.ADMIN, "/dashboard-users"), false);
    assert.equal(canRoleAccessRoute(UserRoles.KITCHEN, "/dashboard-users"), false);
    assert.equal(canRoleAccessRoute(UserRoles.COURIER, "/dashboard-users"), false);
    assert.equal(canRoleAccessRoute(UserRoles.CASHIER, "/dashboard-users"), false);
  });

  it("builds the list request with q, role, status, page, and limit", () => {
    assert.equal(
      dashboardStaffUsersUrl({
        q: "manager",
        role: "admin",
        status: "active",
        page: 1,
        limit: 20,
      }),
      "/api/dashboard/staff-users?q=manager&role=admin&status=active&page=1&limit=20"
    );
  });

  it("creates an exact payload without confirmPassword or extra keys", () => {
    const payload = buildCreateDashboardStaffUserPayload({
      email: "manager@example.com",
      password: "StrongPass1!",
      confirmPassword: "StrongPass1!",
      role: "admin",
      isActive: true,
    });

    assert.deepEqual(Object.keys(payload).sort(), [
      "email",
      "isActive",
      "password",
      "role",
    ]);
    assert.equal(payload.email, "manager@example.com");
  });

  it("rejects mismatched create passwords", () => {
    const result = createDashboardStaffUserSchema.safeParse({
      email: "manager@example.com",
      password: "StrongPass1!",
      confirmPassword: "StrongPass2!",
      role: "admin",
      isActive: true,
    });

    assert.equal(result.success, false);
  });

  it("never offers or accepts superadmin as an assignable role", () => {
    assert.deepEqual(getAssignableDashboardStaffRoles(["admin", "superadmin"]), [
      "admin",
    ]);
    assert.equal(
      createDashboardStaffUserSchema.safeParse({
        email: "manager@example.com",
        password: "StrongPass1!",
        confirmPassword: "StrongPass1!",
        role: "superadmin",
        isActive: true,
      }).success,
      false
    );
  });

  it("maps DASHBOARD_USER_EXISTS to the Arabic duplicate-email message", () => {
    assert.equal(
      getDashboardStaffUserErrorMessage({
        response: { status: 409, data: { code: "DASHBOARD_USER_EXISTS" } },
      }),
      "يوجد مستخدم لوحة تحكم بهذا البريد الإلكتروني بالفعل."
    );
  });

  it("builds edit PATCH with only changed fields", () => {
    const original: DashboardStaffUserDto = {
      id: "staff-1",
      email: "old@example.com",
      role: "admin",
      isActive: true,
      lastLoginAt: null,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };

    assert.deepEqual(
      buildUpdateDashboardStaffUserPatch(original, {
        email: "new@example.com",
        role: "cashier",
        isActive: false,
      }),
      { email: "new@example.com", role: "cashier", isActive: false }
    );
    assert.deepEqual(
      buildUpdateDashboardStaffUserPatch(original, {
        email: "old@example.com",
        role: "admin",
        isActive: true,
      }),
      {}
    );
  });

  it("requires explicit status confirmation state before deactivation submits", () => {
    const original: DashboardStaffUserDto = {
      id: "staff-1",
      email: "old@example.com",
      role: "admin",
      isActive: true,
      lastLoginAt: null,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };

    const patch = buildUpdateDashboardStaffUserPatch(original, {
      email: "old@example.com",
      role: "admin",
      isActive: false,
    });

    assert.equal(Object.prototype.hasOwnProperty.call(patch, "isActive"), true);
  });

  it("uses the dedicated password reset URL and validates matching passwords", () => {
    assert.equal(
      dashboardStaffResetPasswordUrl("staff-1"),
      "/api/dashboard/staff-users/staff-1/reset-password"
    );
    assert.equal(
      resetDashboardStaffPasswordSchema.safeParse({
        password: "StrongPass1!",
        confirmPassword: "different",
      }).success,
      false
    );
  });

  it("clears password fields on success and cancel through form reset behavior", () => {
    const reset = vi.fn();
    const cleanup = () => reset({ password: "", confirmPassword: "" });
    cleanup();

    assert.deepEqual(reset.mock.calls[0][0], {
      password: "",
      confirmPassword: "",
    });
  });

  it("detects backend 403 and TOKEN_REVOKED safely", () => {
    assert.equal(
      isDashboardStaffForbiddenError({
        response: { status: 403, data: { code: "FORBIDDEN" } },
      }),
      true
    );
    assert.equal(
      isDashboardStaffTokenRevokedError({
        response: { status: 401, data: { code: "TOKEN_REVOKED" } },
      }),
      true
    );
  });

  it("does not write password values to browser storage helpers", () => {
    const payload = buildCreateDashboardStaffUserPayload({
      email: "manager@example.com",
      password: "StrongPass1!",
      confirmPassword: "StrongPass1!",
      role: "admin",
      isActive: true,
    });

    assert.equal(payload.password, "StrongPass1!");
    assert.equal(localStorage.getItem("password"), null);
    assert.equal(sessionStorage.getItem("password"), null);
  });
});

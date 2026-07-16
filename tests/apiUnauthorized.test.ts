// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";

const cookieRemoveMock = vi.fn();
const cookieGetMock = vi.fn();

vi.mock("js-cookie", () => ({
  default: {
    get: (...args: unknown[]) => cookieGetMock(...args),
    remove: (...args: unknown[]) => cookieRemoveMock(...args),
  },
}));

describe("api unauthorized interceptor", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    cookieGetMock.mockReturnValue("token-value");
  });

  it("TOKEN_REVOKED invokes the existing unauthorized cookie removal flow", async () => {
    const { default: api } = await import("../src/lib/apis");

    api.defaults.adapter = async () => {
      throw {
        config: {},
        response: {
          status: 403,
          data: {
            code: "TOKEN_REVOKED",
            message: "revoked",
          },
        },
      };
    };

    await expect(api.get("/api/dashboard/staff-users")).rejects.toBeTruthy();

    expect(cookieRemoveMock).toHaveBeenCalledWith("dashboardToken");
  });
});

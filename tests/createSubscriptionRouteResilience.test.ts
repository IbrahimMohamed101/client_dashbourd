import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const routeSource = fs.readFileSync(
  path.join(
    process.cwd(),
    "src/routes/_protected/users/$userId/create-subscription.tsx"
  ),
  "utf8"
);

describe("create-subscription user route resilience", () => {
  it("does not block the form on the display-only user details request", () => {
    expect(routeSource).toContain("useUserDetailsQuery(userId)");
    expect(routeSource).not.toContain("useSuspenseQuery");
    expect(routeSource).not.toContain("ensureQueryData");
    expect(routeSource).toContain(
      "<CreateSubscriptionFormContent userId={userId} />"
    );
  });
});

import assert from "node:assert/strict";
import {
  menuRollbackUrl,
  menuOptionGroupVisibilityUrl,
  menuOptionVisibilityUrl,
  menuVersionsUrl,
} from "../src/utils/menuApiContract";

assert.equal(
  menuOptionVisibilityUrl("option-1"),
  "/api/dashboard/menu/options/option-1/visibility"
);

assert.equal(
  menuOptionGroupVisibilityUrl("group-1"),
  "/api/dashboard/menu/option-groups/group-1/visibility"
);

assert.equal(menuVersionsUrl(), "/api/dashboard/menu/versions");
assert.equal(
  menuVersionsUrl({ page: 2, limit: 10, status: "published" }),
  "/api/dashboard/menu/versions?page=2&limit=10&status=published"
);
assert.equal(
  menuRollbackUrl("version-1"),
  "/api/dashboard/menu/rollback/version-1"
);

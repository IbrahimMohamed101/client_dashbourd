import assert from "node:assert/strict";
import {
  menuOptionGroupVisibilityUrl,
  menuOptionVisibilityUrl,
} from "../src/utils/menuApiContract";

assert.equal(
  menuOptionVisibilityUrl("option-1"),
  "/api/dashboard/menu/options/option-1/visibility"
);

assert.equal(
  menuOptionGroupVisibilityUrl("group-1"),
  "/api/dashboard/menu/option-groups/group-1/visibility"
);

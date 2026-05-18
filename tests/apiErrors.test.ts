import assert from "node:assert/strict";
import { getApiErrorMessage } from "../src/lib/apiErrors";

assert.equal(
  getApiErrorMessage({ response: { data: { message: "Top-level message" } } }),
  "Top-level message"
);

assert.equal(
  getApiErrorMessage({
    response: { data: { error: { message: "Nested message" } } },
  }),
  "Nested message"
);

assert.equal(
  getApiErrorMessage({
    response: { data: { error: { messageKey: "payments.not_found" } } },
  }),
  "payments.not_found"
);

assert.equal(getApiErrorMessage({ message: "Network Error" }), "Network Error");
assert.equal(getApiErrorMessage({}), "Unexpected error");

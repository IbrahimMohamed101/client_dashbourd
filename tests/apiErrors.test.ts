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

assert.equal(
  getApiErrorMessage({
    response: {
      data: {
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          details: { field: "email" },
        },
      },
    },
  }),
  "VALIDATION_ERROR"
);

assert.equal(
  getApiErrorMessage({
    response: {
      data: {
        success: false,
        message: "Image file is required under the image field",
        expectedField: "image",
      },
    },
  }),
  "Image file is required under the image field"
);

assert.equal(
  getApiErrorMessage({
    response: { data: { status: false, code: "ACTION_NOT_ALLOWED" } },
  }),
  "ACTION_NOT_ALLOWED"
);

assert.equal(
  getApiErrorMessage({
    response: { data: { ok: false, error: "NOT_FOUND", status: "approved" } },
  }),
  "NOT_FOUND"
);

assert.equal(getApiErrorMessage({ message: "Network Error" }), "Network Error");
assert.equal(getApiErrorMessage({}), "Unexpected error");

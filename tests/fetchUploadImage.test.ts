import assert from "node:assert/strict";
import { createImageUploadFormData } from "../src/utils/fetchUploadImage";

const file = new File(["image-bytes"], "product.png", { type: "image/png" });
const formData = createImageUploadFormData(file);

assert.equal(formData.get("image"), file);
assert.equal(formData.has("file"), false);

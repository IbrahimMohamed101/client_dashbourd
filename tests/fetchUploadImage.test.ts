import assert from "node:assert/strict";
import {
  createImageUploadFormData,
  resolveUploadedImageUrl,
} from "../src/utils/fetchUploadImage";

const file = new File(["image-bytes"], "product.png", { type: "image/png" });
const formData = createImageUploadFormData(file);

assert.equal(formData.get("image"), file);
assert.equal(formData.has("file"), false);

assert.equal(
  resolveUploadedImageUrl({
    status: true,
    data: {
      imageUrl: "https://cdn.example.com/f_auto/menu/product.webp",
      secureUrl: "https://cdn.example.com/raw/product.webp",
      publicId: "basicdiet145/menu/product",
      resourceType: "image",
    },
  }),
  "https://cdn.example.com/f_auto/menu/product.webp"
);

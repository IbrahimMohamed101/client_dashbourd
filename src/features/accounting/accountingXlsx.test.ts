import { describe, expect, it } from "vitest";
import { createAccountingXlsx } from "./accountingXlsx";

function zipEntries(bytes: Uint8Array) {
  const reader = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let position = 0;
  const entries: Record<string, string> = {};
  const decoder = new TextDecoder();
  while (reader.getUint32(position, true) === 0x04034b50) {
    const method = reader.getUint16(position + 8, true);
    expect(method).toBe(0); // Stored OOXML package
    const size = reader.getUint32(position + 18, true);
    const fileNameLength = reader.getUint16(position + 26, true);
    const extraLength = reader.getUint16(position + 28, true);
    const nameStart = position + 30;
    const dataStart = nameStart + fileNameLength + extraLength;
    const name = decoder.decode(bytes.subarray(nameStart, nameStart + fileNameLength));
    const data = decoder.decode(bytes.subarray(dataStart, dataStart + size));
    entries[name] = data;
    position = dataStart + size;
  }
  expect(reader.getUint32(position, true)).toBe(0x02014b50);
  const tail = bytes.byteLength - 22;
  expect(reader.getUint32(tail, true)).toBe(0x06054b50);
  expect(reader.getUint16(tail + 8, true)).toBe(Object.keys(entries).length);
  return entries;
}

describe("actual XLSX financial export", () => {
  it("builds valid Excel ZIP parts with Arabic sheet, numeric money and RTL", () => {
    const bytes = createAccountingXlsx([
      { name: "الملخص المالي", columns: [
        { label: "البند", width: 32 }, { label: "القيمة (ريال)", money: true },
      ], rows: [["نقدي", 7], ["ضريبة", 0.91]] },
      { name: "حركة القنوات", columns: [{ label: "القناة" }], rows: [["جاهز"]] },
    ]);
    expect(bytes[0]).toBe(0x50); expect(bytes[1]).toBe(0x4B);
    const files = zipEntries(bytes);
    expect(Object.keys(files)).toHaveLength(7);
    expect(files["[Content_Types].xml"]).toContain("sheet2.xml");
    expect(files["xl/workbook.xml"]).toContain("الملخص المالي");
    expect(files["xl/workbook.xml"]).toContain("حركة القنوات");
    expect(files["xl/worksheets/sheet1.xml"]).toContain('rightToLeft="1"');
    expect(files["xl/worksheets/sheet1.xml"]).toContain('<v>0.91</v>');
    expect(files["xl/worksheets/sheet1.xml"]).toContain('s="2"');
    expect(files["xl/styles.xml"]).toContain('numFmtId="164"');
  });
  it("prevents formula injection from external order references", () => {
    const files = zipEntries(createAccountingXlsx([{
      name: "البيانات", columns: [{ label: "مرجع" }],
      rows: [['=HYPERLINK("https://example.test")'], ["<unsafe> & "quote""]],
    }]));
    const xml = files["xl/worksheets/sheet1.xml"];
    expect(xml).toContain('t="inlineStr"');
    expect(xml).not.toContain("<f>");
    expect(xml).toContain("&lt;unsafe&gt; &amp;");
  });
  it("rejects duplicate worksheet names", () => {
    const sheet = { name: "مكرر", columns: [{ label: "رقم" }], rows: [[1]] };
    expect(() => createAccountingXlsx([sheet, sheet])).toThrow(/أسماء/);
  });
});

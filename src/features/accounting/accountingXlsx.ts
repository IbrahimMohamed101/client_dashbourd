// Native XLSX (Office Open XML). Dependency-free ZIP/STORED writer:
// real .xlsx with numeric cells, RTL worksheets, headers and freeze panes.
// User strings are written exclusively as inlineStr, never as Excel formulas.
export type AccountingExcelValue = string | number | null | undefined;
export type AccountingExcelColumn = { label: string; width?: number; money?: boolean };
export type AccountingExcelSheet = {
  name: string;
  columns: AccountingExcelColumn[];
  rows: AccountingExcelValue[][];
};

const encoder = new TextEncoder();
function xmlText(value: unknown) {
  return String(value ?? "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
function colName(index: number): string {
  let n = index + 1;
  let name = "";
  while (n > 0) {
    n -= 1;
    name = String.fromCharCode(65 + (n % 26)) + name;
    n = Math.floor(n / 26);
  }
  return name;
}
function sheetXml(sheet: AccountingExcelSheet) {
  if (!sheet.columns.length || sheet.columns.length > 150 ||
      sheet.rows.length > 1_048_575) throw new Error("عدد أعمدة أو صفوف Excel غير مدعوم.");
  const headers = sheet.columns.map((column, i) =>
    `<c r="${colName(i)}1" s="1" t="inlineStr"><is><t>${xmlText(column.label)}</t></is></c>`).join("");
  const rows = sheet.rows.map((row, rowIndex) => {
    const r = rowIndex + 2;
    return `<row r="${r}">${sheet.columns.map((column, i) => {
      const value = row[i];
      if (value === null || value === undefined) return "";
      const address = colName(i) + r;
      if (typeof value === "number" && Number.isFinite(value)) {
        return `<c r="${address}" s="${column.money ? 2 : 0}"><v>${value}</v></c>`;
      }
      return `<c r="${address}" t="inlineStr"><is><t xml:space="preserve">${xmlText(value)}</t></is></c>`;
    }).join("")}</row>`;
  }).join("");
  const columns = sheet.columns.map((column, i) =>
    `<col min="${i + 1}" max="${i + 1}" width="${Math.min(55, Math.max(12, column.width ?? 22))}" customWidth="1"/>`).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<dimension ref="A1:${colName(sheet.columns.length - 1)}${Math.max(1, sheet.rows.length + 1)}"/>
<sheetViews><sheetView showGridLines="0" rightToLeft="1" workbookViewId="0">
<pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/>
</sheetView></sheetViews><sheetFormatPr defaultRowHeight="20"/>
<cols>${columns}</cols><sheetData><row r="1" ht="28" customHeight="1">${headers}</row>${rows}</sheetData>
${sheet.rows.length ? `<autoFilter ref="A1:${colName(sheet.columns.length - 1)}${sheet.rows.length + 1}"/>` : ""}
</worksheet>`;
}
const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<numFmts count="1"><numFmt numFmtId="164" formatCode="#,##0.00"/></numFmts>
<fonts count="2"><font><sz val="11"/><name val="Arial"/></font>
<font><b/><sz val="12"/><color rgb="FFFFFFFF"/><name val="Arial"/></font></fonts>
<fills count="2"><fill><patternFill patternType="none"/></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FF17324C"/><bgColor indexed="64"/></patternFill></fill></fills>
<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="3">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="0" fontId="1" fillId="1" borderId="0" xfId="0" applyFont="1" applyFill="1">
<alignment horizontal="right" vertical="center"/></xf>
<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;

function crc32(bytes: Uint8Array): number {
  let crc = 0xFFFFFFFF;
  for (const byte of bytes) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) {
      crc = (crc >>> 1) ^ ((crc & 1) ? 0xEDB88320 : 0);
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}
function concat(parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((sum, item) => sum + item.byteLength, 0);
  const output = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) { output.set(part, offset); offset += part.byteLength; }
  return output;
}
function zipStore(files: { path: string; xml: string }[]): Uint8Array {
  const local: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;
  let centralSize = 0;
  for (const file of files) {
    const name = encoder.encode(file.path);
    const contents = encoder.encode(file.xml);
    const crc = crc32(contents);
    const localHead = new Uint8Array(30);
    let view = new DataView(localHead.buffer);
    view.setUint32(0, 0x04034b50, true);
    view.setUint16(4, 20, true);
    view.setUint16(6, 0x0800, true); // UTF-8 names
    view.setUint16(8, 0, true); // stored (not compressed)
    view.setUint32(14, crc, true);
    view.setUint32(18, contents.byteLength, true);
    view.setUint32(22, contents.byteLength, true);
    view.setUint16(26, name.byteLength, true);
    local.push(localHead, name, contents);
    const centralHead = new Uint8Array(46);
    view = new DataView(centralHead.buffer);
    view.setUint32(0, 0x02014b50, true);
    view.setUint16(4, 20, true);
    view.setUint16(6, 20, true);
    view.setUint16(8, 0x0800, true);
    view.setUint16(16, 0, true);
    view.setUint32(16, crc, true); // CRC at central header offset 16
    view.setUint32(20, contents.byteLength, true);
    view.setUint32(24, contents.byteLength, true);
    view.setUint16(28, name.byteLength, true);
    view.setUint32(42, offset, true);
    central.push(centralHead, name);
    offset += localHead.byteLength + name.byteLength + contents.byteLength;
    centralSize += centralHead.byteLength + name.byteLength;
  }
  const end = new Uint8Array(22);
  const view = new DataView(end.buffer);
  view.setUint32(0, 0x06054b50, true);
  view.setUint16(8, files.length, true);
  view.setUint16(10, files.length, true);
  view.setUint32(12, centralSize, true);
  view.setUint32(16, offset, true);
  return concat([...local, ...central, end]);
}
export function createAccountingXlsx(sheets: AccountingExcelSheet[]): Uint8Array {
  if (!sheets.length || sheets.length > 20 ||
      new Set(sheets.map(x => x.name)).size !== sheets.length ||
      sheets.some(x => !x.name || x.name.length > 31 || /[\\/:*?\[\]]/.test(x.name))) {
    throw new Error("أسماء أوراق Excel غير صالحة.");
  }
  const files = [
    { path: "[Content_Types].xml",
      xml: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
${sheets.map((_, index) => `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("")}
</Types>` },
    { path: "_rels/.rels", xml: `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>` },
    { path: "xl/workbook.xml", xml: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
 xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<bookViews><workbookView activeTab="0"/></bookViews>
<sheets>${sheets.map((sheet, index) =>
  `<sheet name="${xmlText(sheet.name)}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`).join("")}</sheets>
</workbook>` },
    { path: "xl/_rels/workbook.xml.rels", xml: `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
${sheets.map((_, index) =>
  `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`).join("")}
<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>` },
    { path: "xl/styles.xml", xml: stylesXml },
    ...sheets.map((sheet, index) => ({
      path: `xl/worksheets/sheet${index + 1}.xml`, xml: sheetXml(sheet),
    })),
  ];
  return zipStore(files);
}
export function downloadAccountingXlsx(bytes: Uint8Array, fileName: string) {
  const blob = new Blob([new Uint8Array(bytes)], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName.endsWith(".xlsx") ? fileName : fileName + ".xlsx";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 3000);
}

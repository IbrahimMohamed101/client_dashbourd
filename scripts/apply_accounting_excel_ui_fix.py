from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one match, found {count}")
    return text.replace(old, new, 1)


# Type contract: expose source/provider axes and Moyasar summary fields.
types_path = Path("src/features/accounting/accountingTypes.ts")
types_text = types_path.read_text(encoding="utf-8")
types_text = replace_once(
    types_text,
    '''  cardCount?: number | null;
  cardTotalHalala?: number | null;
  cardTotalFormattedAr?: string | null;
  cancelledSubscriptionsCount?: number | null;
''',
    '''  cardCount?: number | null;
  cardTotalHalala?: number | null;
  cardTotalFormattedAr?: string | null;
  moyasarCount?: number | null;
  moyasarCustomersCount?: number | null;
  moyasarTotalHalala?: number | null;
  moyasarTotalFormattedAr?: string | null;
  reviewItemsCount?: number | null;
  cancelledSubscriptionsCount?: number | null;
''',
    "summary Moyasar fields",
)
types_text = replace_once(
    types_text,
    '''  bySubscriptionStatus?: SubscriptionPaymentBucket[] | null;
  byPaymentType?: SubscriptionPaymentBucket[] | null;
  reconciliation?: SubscriptionPaymentReconciliation | null;
''',
    '''  bySubscriptionStatus?: SubscriptionPaymentBucket[] | null;
  byPaymentType?: SubscriptionPaymentBucket[] | null;
  bySourceChannel?: SubscriptionPaymentBucket[] | null;
  byPaymentProvider?: SubscriptionPaymentBucket[] | null;
  reconciliation?: SubscriptionPaymentReconciliation | null;
''',
    "source/provider report fields",
)
types_path.write_text(types_text, encoding="utf-8")

# Open the accounting page on today's report instead of silently showing 30 days.
route_path = Path("src/routes/_protected/accounting/index.tsx")
route_text = route_path.read_text(encoding="utf-8")
route_text = replace_once(
    route_text,
    '  const [reportMode, setReportMode] = useState<AccountingReportMode>("range");',
    '  const [reportMode, setReportMode] = useState<AccountingReportMode>("daily");',
    "default daily mode",
)
route_path.write_text(route_text, encoding="utf-8")

# Report UI: provider filtering, clear labels, and true Excel export wording.
component_path = Path("src/features/accounting/components/SubscriptionPaymentsReport.tsx")
component_text = component_path.read_text(encoding="utf-8")
component_text = replace_once(
    component_text,
    '''  buildSubscriptionPaymentsCsv,
  downloadTextFile,
  subscriptionPaymentsCsvFileName,
''',
    '''  buildSubscriptionPaymentsExcel,
  downloadExcelFile,
  subscriptionPaymentsExcelFileName,
''',
    "Excel imports",
)
component_text = replace_once(
    component_text,
    '''  const [methodFilter, setMethodFilter] = useState("all");
  const [reviewFilter, setReviewFilter] = useState("all");
''',
    '''  const [methodFilter, setMethodFilter] = useState("all");
  const [providerFilter, setProviderFilter] = useState("all");
  const [reviewFilter, setReviewFilter] = useState("all");
''',
    "provider state",
)
component_text = replace_once(
    component_text,
    '''      const matchesReview =
        reviewFilter === "all" ||
        (reviewFilter === "needs-review" && item.needsReview === true) ||
        (reviewFilter === "clean" && item.needsReview !== true);
      return matchesSearch && matchesMethod && matchesReview;
''',
    '''      const matchesProvider =
        providerFilter === "all" ||
        (item.paymentProvider ?? item.provider) === providerFilter;
      const matchesReview =
        reviewFilter === "all" ||
        (reviewFilter === "needs-review" && item.needsReview === true) ||
        (reviewFilter === "clean" && item.needsReview !== true);
      return matchesSearch && matchesMethod && matchesProvider && matchesReview;
''',
    "provider filtering",
)
component_text = replace_once(
    component_text,
    '''  }, [methodFilter, report?.items, reviewFilter, search]);
''',
    '''  }, [methodFilter, providerFilter, report?.items, reviewFilter, search]);
''',
    "filter dependencies",
)
component_text = replace_once(
    component_text,
    '''    downloadTextFile(
      buildSubscriptionPaymentsCsv(report, filteredItems),
      subscriptionPaymentsCsvFileName(report)
    );
''',
    '''    downloadExcelFile(
      buildSubscriptionPaymentsExcel(report, filteredItems),
      subscriptionPaymentsExcelFileName(report)
    );
''',
    "Excel download",
)
component_text = replace_once(
    component_text,
    '''          <Button onClick={exportCsv}>
            تصدير CSV
          </Button>
''',
    '''          <Button onClick={exportCsv}>
            تصدير Excel منسق
          </Button>
''',
    "Excel button label",
)
component_text = replace_once(
    component_text,
    '''          <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px_120px]">
''',
    '''          <div className="grid gap-3 lg:grid-cols-[1fr_170px_170px_170px_120px]">
''',
    "filter grid",
)
component_text = replace_once(
    component_text,
    '''            </Select>
            <Select value={reviewFilter} onValueChange={(value) => {
''',
    '''            </Select>
            <Select value={providerFilter} onValueChange={(value) => {
              setProviderFilter(value);
              setPage(1);
            }}>
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل مزودي الدفع</SelectItem>
                <SelectItem value="moyasar">ميسر</SelectItem>
                <SelectItem value="manual_gateway">بوابة مسجلة يدويًا</SelectItem>
                <SelectItem value="none">نقدي / بدون مزود</SelectItem>
                <SelectItem value="unknown">مزود غير محدد</SelectItem>
              </SelectContent>
            </Select>
            <Select value={reviewFilter} onValueChange={(value) => {
''',
    "provider select",
)
component_text = replace_once(
    component_text,
    '''      titleAr: "إجمالي التحصيل",
''',
    '''      titleAr: "إجمالي تحصيل الاشتراكات",
''',
    "fallback gross title",
)
component_text = replace_once(
    component_text,
    '''      titleAr: "تحصيل البطاقات",
''',
    '''      titleAr: "تحصيل البطاقات (يشمل ميسر)",
''',
    "fallback card title",
)
component_text = replace_once(
    component_text,
    '''          <BucketList title="حسب حالة الاشتراك" buckets={report.bySubscriptionStatus} currency={currency} />
          <BucketList title="حسب نوع الدفعة" buckets={report.byPaymentType} currency={currency} />
''',
    '''          <BucketList title="حسب حالة الاشتراك" buckets={report.bySubscriptionStatus} currency={currency} />
          <BucketList title="حسب نوع الدفعة" buckets={report.byPaymentType} currency={currency} />
          <BucketList title="حسب قناة المصدر" buckets={report.bySourceChannel} currency={currency} />
          <BucketList title="حسب مزود الدفع" buckets={report.byPaymentProvider} currency={currency} />
''',
    "source/provider breakdowns",
)
component_path.write_text(component_text, encoding="utf-8")

# Focused tests now validate SpreadsheetML and the .xls download contract.
test_path = Path("tests/accountingReports.test.ts")
test_text = test_path.read_text(encoding="utf-8")
test_text = replace_once(
    test_text,
    '''  buildSubscriptionPaymentsCsv,
  subscriptionPaymentsCsvFileName,
''',
    '''  buildSubscriptionPaymentsExcel,
  subscriptionPaymentsExcelFileName,
''',
    "test imports",
)
test_text = replace_once(
    test_text,
    '''test("accounting subscription report formatters and csv", () => {
''',
    '''test("accounting subscription report formatters and Excel workbook", () => {
''',
    "test title",
)
test_text = replace_once(
    test_text,
    '''  const csv = buildSubscriptionPaymentsCsv(report);
  assert.ok(csv.startsWith("\\ufeff"));
  assert.ok(csv.includes("مرجع الدفعة"));
  assert.ok(csv.includes("PAY-1"));
  assert.ok(csv.includes("REF-1"));
  assert.ok(csv.includes("مرتجع"));
  assert.ok(csv.includes("التطبيق"));
  assert.ok(csv.includes("ميسر"));
  assert.ok(csv.includes("صافي الحركة"));
  assert.ok(csv.includes("اشتراك ملغي"));
  assert.equal(csv.includes("[object Object]"), false);
  assert.equal(subscriptionPaymentsCsvFileName(report), "تقرير-تحصيل-الاشتراكات-2026-07-25.csv");
''',
    '''  const excel = buildSubscriptionPaymentsExcel(report);
  assert.ok(excel.startsWith("<?xml version=\\"1.0\\""));
  assert.ok(excel.includes("Excel.Sheet"));
  assert.ok(excel.includes("Worksheet ss:Name=\\"الملخص\\""));
  assert.ok(excel.includes("Worksheet ss:Name=\\"المدفوعات\\""));
  assert.ok(excel.includes("Worksheet ss:Name=\\"التصنيفات\\""));
  assert.ok(excel.includes("مرجع الدفعة"));
  assert.ok(excel.includes("PAY-1"));
  assert.ok(excel.includes("REF-1"));
  assert.ok(excel.includes("مرتجع"));
  assert.ok(excel.includes("التطبيق"));
  assert.ok(excel.includes("ميسر"));
  assert.ok(excel.includes("صافي الحركة"));
  assert.ok(excel.includes("اشتراك ملغي"));
  assert.ok(excel.includes('ss:StyleID="Money"'));
  assert.ok(excel.includes("DisplayRightToLeft"));
  assert.equal(excel.includes("[object Object]"), false);
  assert.equal(subscriptionPaymentsExcelFileName(report), "تقرير-تحصيل-الاشتراكات-2026-07-25.xls");
''',
    "Excel assertions",
)
test_path.write_text(test_text, encoding="utf-8")

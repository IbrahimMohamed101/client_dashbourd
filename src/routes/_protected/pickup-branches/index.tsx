import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Loader } from "@/components/global/loader";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { pickupBranchesQueryOptions } from "@/hooks/useSettingsQuery";
import type { LocalizedText, PickupLocation } from "@/types/pickupTypes";

const idFields = ["id", "key", "code", "slug", "branchId", "pickupLocationId"];

const readLocalized = (value: unknown) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  const localized = value as LocalizedText;
  return localized.ar || localized.en || "";
};

const getBranchId = (location: PickupLocation) => {
  for (const field of idFields) {
    const value = location[field];
    if (typeof value === "string" && value.trim()) return value;
  }
  return location._id || "";
};

const isActivePickupLocation = (location: PickupLocation) =>
  location.isActive !== false &&
  location.active !== false &&
  location.enabled !== false &&
  location.isEnabled !== false &&
  location.isAvailable !== false &&
  location.available !== false &&
  location.pickupEnabled !== false &&
  location.supportsPickup !== false &&
  location.pickupAvailable !== false &&
  location.availableForPickup !== false &&
  location.acceptsPickup !== false;

export const Route = createFileRoute("/_protected/pickup-branches/")({
  component: PickupBranchesPage,
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(pickupBranchesQueryOptions),
  pendingComponent: () => (
    <Loader variant="full-screen" label="جاري تحميل فروع الاستلام..." />
  ),
});

function PickupBranchesPage() {
  const { data } = useSuspenseQuery(pickupBranchesQueryOptions);
  const branches = data.data.pickup_locations;
  const mainBranch = branches.find((branch) => getBranchId(branch) === "main");

  return (
    <div className="space-y-6 px-4 lg:px-6" dir="rtl">
      <Card className="border-none bg-gradient-to-l from-primary/10 via-background to-background shadow-none">
        <CardHeader>
          <CardTitle>فروع الاستلام</CardTitle>
          <CardDescription>
            تقرأ هذه الصفحة pickup_locations من /api/dashboard/settings.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>الفرع الافتراضي</CardTitle>
            <CardDescription>
              منطق backend يستخدم branchId: main كفرع دائم.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {mainBranch ? (
              <BranchSummary branch={mainBranch} />
            ) : (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                لم يتم العثور على فرع main ضمن الإعدادات الحالية.
              </div>
            )}
            <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
              لا يوجد endpoint مخصص لتعديل فروع الاستلام، و PATCH /settings لا
              يقبل pickup_locations في backend الحالي.
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>كل الفروع</CardTitle>
            <CardDescription>
              نوافذ الاستلام العامة:{" "}
              {data.data.pickup_windows.length
                ? data.data.pickup_windows.join(", ")
                : "غير محددة"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">المعرف</TableHead>
                    <TableHead className="text-right">الاسم</TableHead>
                    <TableHead className="text-right">العنوان</TableHead>
                    <TableHead className="text-right">النوافذ</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {branches.map((branch) => (
                    <TableRow
                      key={getBranchId(branch) || readLocalized(branch.name)}
                    >
                      <TableCell dir="ltr" className="font-mono text-xs">
                        {getBranchId(branch) || "-"}
                      </TableCell>
                      <TableCell>
                        {readLocalized(branch.name || branch.title) || "-"}
                      </TableCell>
                      <TableCell className="max-w-xs">
                        {readLocalized(branch.address) || "-"}
                      </TableCell>
                      <TableCell>
                        {(branch.pickupWindows || branch.windows || []).join(", ") ||
                          "-"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            isActivePickupLocation(branch)
                              ? "default"
                              : "secondary"
                          }
                        >
                          {isActivePickupLocation(branch) ? "نشط" : "غير نشط"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!branches.length && (
                    <TableRow>
                      <TableCell colSpan={5} className="py-8 text-center">
                        لا توجد فروع استلام محفوظة.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function BranchSummary({ branch }: { branch: PickupLocation }) {
  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="font-semibold">
            {readLocalized(branch.name || branch.title) || "main"}
          </div>
          <div className="text-xs text-muted-foreground" dir="ltr">
            {getBranchId(branch)}
          </div>
        </div>
        <Badge variant={isActivePickupLocation(branch) ? "default" : "secondary"}>
          {isActivePickupLocation(branch) ? "نشط" : "غير نشط"}
        </Badge>
      </div>
      <div className="text-sm text-muted-foreground">
        {readLocalized(branch.address) || "لا يوجد عنوان محفوظ"}
      </div>
      <div className="text-sm">
        {(branch.pickupWindows || branch.windows || []).join(", ") ||
          "لا توجد نوافذ محفوظة"}
      </div>
    </div>
  );
}

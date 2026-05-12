import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMenuAuditLogsQuery } from "@/hooks/useMenuQuery";
import {
  MenuEmptyState,
  MenuKeyBadge,
  MenuLoadingTable,
  MenuSectionCard,
  MenuTableFrame,
} from "@/components/pages/menu/MenuTabScaffold";
import type { MenuAuditLog } from "@/types/menuTypes";

const ACTION_LABELS: Record<string, string> = {
  create: "إنشاء",
  update: "تحديث",
  delete: "حذف",
  publish: "نشر",
  validate: "تحقق",
};

const ENTITY_LABELS: Record<string, string> = {
  category: "تصنيف",
  product: "منتج",
  option_group: "مجموعة خيارات",
  option: "خيار",
  menu: "القائمة",
};

export function MenuAuditLogTab() {
  const { data, isLoading } = useMenuAuditLogsQuery({ limit: 50 });
  const logs = data?.data?.items || [];

  const formatDate = (dateStr: string) => {
    try {
      return new Intl.DateTimeFormat("ar-SA", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(dateStr));
    } catch {
      return dateStr;
    }
  };

  return (
    <MenuSectionCard
      title="سجل التغييرات"
      description="راجع آخر عمليات الإنشاء والتعديل والحذف والنشر داخل دورة القائمة."
    >
      {isLoading ? (
        <MenuLoadingTable columns={5} />
      ) : logs.length === 0 ? (
        <MenuEmptyState
          title="لا توجد سجلات بعد"
          description="ستظهر هنا العمليات التي تتم على التصنيفات والمنتجات والخيارات عند بدء إدارة القائمة."
        />
      ) : (
        <MenuTableFrame>
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-12 text-center">#</TableHead>
                <TableHead>الإجراء</TableHead>
                <TableHead>النوع</TableHead>
                <TableHead>المعرف</TableHead>
                <TableHead>التاريخ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log: MenuAuditLog, index: number) => (
                <TableRow key={log.id}>
                  <TableCell className="text-center text-muted-foreground">
                    {index + 1}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        log.action === "delete"
                          ? "destructive"
                          : log.action === "create"
                            ? "default"
                            : "secondary"
                      }
                    >
                      {ACTION_LABELS[log.action] || log.action}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {ENTITY_LABELS[log.entityType] || log.entityType}
                  </TableCell>
                  <TableCell>
                    <MenuKeyBadge value={`${log.entityId.slice(0, 8)}...`} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(log.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </MenuTableFrame>
      )}
    </MenuSectionCard>
  );
}

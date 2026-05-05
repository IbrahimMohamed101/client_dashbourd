import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  MoreHorizontal,
  Plus,
  Search,
  Ticket,
  Calendar as CalendarIcon,
  Trash2,
  Edit,
  ArrowUpDown,
  Filter,
  CheckCircle2,
  Clock,
  Ban,
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useDeletePromoCodeMutation } from "@/hooks/usePromoCodesQuery";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { PromoCodeDTO } from "@/types/financeTypes";
import { PromoCodeDialog } from "./PromoCodeDialog";

interface PromoCodesTableProps {
  data: PromoCodeDTO[];
  isLoading: boolean;
}

export function PromoCodesTable({ data, isLoading }: PromoCodesTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editData, setEditData] = useState<PromoCodeDTO | undefined>();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const deleteMutation = useDeletePromoCodeMutation();

  const getFilteredData = () => {
    return data.filter((item) =>
      item.code.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const handleEdit = (promo: PromoCodeDTO) => {
    setEditData(promo);
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setEditData(undefined);
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync(deleteId);
      toast.success("تم حذف الكوبون بنجاح");
      setDeleteId(null);
    } catch {
      toast.error("حدث خطأ أثناء الحذف");
    }
  };

  if (isLoading) {
    return (
      <div className="flex animate-pulse flex-col gap-4 px-4 lg:px-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 w-full rounded-xl bg-muted/50" />
        ))}
      </div>
    );
  }

  const getStatusBadge = (status: PromoCodeDTO["status"]) => {
    switch (status) {
      case "active":
        return (
          <Badge
            variant="outline"
            className="gap-1.5 rounded-full border-emerald-500/20 bg-emerald-500/10 px-3 py-1 font-bold text-emerald-500"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            نشط
          </Badge>
        );
      case "expired":
        return (
          <Badge
            variant="outline"
            className="gap-1.5 rounded-full border-orange-500/20 bg-orange-500/10 px-3 py-1 font-bold text-orange-500"
          >
            <Clock className="h-3.5 w-3.5" />
            منتهي
          </Badge>
        );
      case "disabled":
        return (
          <Badge
            variant="outline"
            className="gap-1.5 rounded-full border-rose-500/20 bg-rose-500/10 px-3 py-1 font-bold text-rose-500"
          >
            <Ban className="h-3.5 w-3.5" />
            معطل
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col justify-between gap-4 rounded-3xl border border-muted-foreground/10 bg-background/50 p-4 backdrop-blur-md sm:flex-row sm:items-center">
        <div className="group relative max-w-sm flex-1">
          <Search className="absolute top-1/2 right-4 size-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
          <Input
            placeholder="البحث عن كود خصم..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-12 rounded-2xl border-muted-foreground/5 bg-muted/30 pr-11 ring-offset-background transition-all focus:bg-background"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="h-12 gap-2 rounded-2xl border-muted-foreground/10 px-5 transition-colors hover:bg-muted/50"
          >
            <Filter className="size-4" />
            تصفية
          </Button>
          <Button
            onClick={handleAdd}
            className="h-12 gap-2 rounded-2xl px-6 shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
          >
            <Plus className="size-4" />
            إضافة كوبون جديد
          </Button>
        </div>
      </div>

      {/* Table Card */}
      <div className="overflow-hidden rounded-[2.5rem] border border-muted-foreground/10 bg-card/30 shadow-xl shadow-foreground/5 backdrop-blur-sm">
        <Table>
          <TableHeader>
            <TableRow className="border-muted-foreground/10 hover:bg-transparent">
              <TableHead className="h-16 text-right font-black text-foreground/80">
                الكود
              </TableHead>
              <TableHead className="h-16 text-right font-black text-foreground/80">
                <div className="flex items-center gap-2">
                  القيمة
                  <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </TableHead>
              <TableHead className="h-16 text-center text-right font-black text-foreground/80">
                الاستخدامات
              </TableHead>
              <TableHead className="h-16 text-right font-black text-foreground/80">
                تاريخ الانتهاء
              </TableHead>
              <TableHead className="h-16 text-right font-black text-foreground/80">
                الحالة
              </TableHead>
              <TableHead className="h-16 text-center font-black text-foreground/80">
                إجراءات
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {getFilteredData().map((promo: PromoCodeDTO) => (
              <TableRow
                key={promo.id}
                className="group border-muted-foreground/5 transition-colors hover:bg-primary/[0.03]"
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
                      <Ticket className="size-5" />
                    </div>
                    <span className="font-mono text-lg font-black tracking-wider text-foreground/90 uppercase">
                      {promo.code}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-base font-bold">
                      {promo.type === "percentage"
                        ? `${promo.value}%`
                        : `${promo.value} ر.س`}
                    </span>
                    <span className="text-[10px] font-medium text-muted-foreground uppercase">
                      {promo.type === "percentage" ? "خصم مئوي" : "مبلغ ثابت"}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="text-base font-bold">
                      {promo.usageCount}
                    </span>
                    <span className="text-xs text-muted-foreground">/</span>
                    <span className="text-xs text-muted-foreground">
                      {promo.maxUsage || "∞"}
                    </span>
                  </div>
                  <div className="mx-auto mt-1.5 h-1.5 w-20 overflow-hidden rounded-full bg-muted/50">
                    <div
                      className="h-full bg-primary transition-all duration-500"
                      style={{
                        width: `${Math.min((promo.usageCount / (promo.maxUsage || promo.usageCount + 10)) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 font-medium text-muted-foreground">
                    <CalendarIcon className="size-4 opacity-50" />
                    {format(new Date(promo.expiryDate), "dd MMM yyyy", {
                      locale: ar,
                    })}
                  </div>
                </TableCell>
                <TableCell>{getStatusBadge(promo.status)}</TableCell>
                <TableCell className="text-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="size-10 rounded-xl p-0 transition-colors hover:bg-primary/10 hover:text-primary"
                      >
                        <MoreHorizontal className="size-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-48 rounded-2xl border-muted-foreground/10 p-2 shadow-2xl"
                    >
                      <DropdownMenuLabel className="px-3 pb-2 text-xs font-bold text-muted-foreground">
                        خيارات التحكم
                      </DropdownMenuLabel>
                      <DropdownMenuItem
                        onClick={() => handleEdit(promo)}
                        className="cursor-pointer gap-2.5 rounded-xl px-3 py-2 transition-colors focus:bg-primary/10 focus:text-primary"
                      >
                        <Edit className="size-4" />
                        تعديل الكوبون
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="my-1 bg-muted-foreground/10" />
                      <DropdownMenuItem
                        onClick={() => setDeleteId(promo.id)}
                        className="cursor-pointer gap-2.5 rounded-xl px-3 py-2 text-rose-500 transition-colors focus:bg-rose-500/10 focus:text-rose-600"
                      >
                        <Trash2 className="size-4" />
                        حذف الكوبون
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {getFilteredData().length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center gap-4 opacity-50 grayscale">
                    <div className="flex size-20 items-center justify-center rounded-full bg-muted">
                      <Ticket className="size-10 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-lg font-black text-muted-foreground">
                        لا توجد كوبونات خصم
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground/60">
                        جرب تغيير كلمة البحث أو أضف كوبوناً جديداً
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <PromoCodeDialog
        key={editData?.id ?? "new"}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        editData={editData}
      />

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent className="rounded-[2rem] border-muted-foreground/10 bg-background/95 backdrop-blur-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-3 text-xl font-black">
              <div className="flex size-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500">
                <Trash2 className="size-5" />
              </div>
              هل أنت متأكد من الحذف؟
            </AlertDialogTitle>
            <AlertDialogDescription className="pt-2 text-right font-medium text-muted-foreground">
              سيتم حذف كوبون الخصم بشكل نهائي. هذا الإجراء لا يمكن التراجع عنه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 flex-row-reverse gap-2">
            <AlertDialogAction
              onClick={handleDelete}
              className="h-11 rounded-xl bg-rose-500 px-6 transition-all hover:bg-rose-600 active:scale-95"
            >
              نعم، احذف الكوبون
            </AlertDialogAction>
            <AlertDialogCancel className="mt-0 h-11 rounded-xl border-muted-foreground/10 px-6 hover:bg-muted/50">
              إلغاء
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

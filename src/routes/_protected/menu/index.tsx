import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen,
  CheckCircle2,
  FileText,
  FolderOpen,
  Layers,
  Link2,
  Package,
  Settings2,
} from "lucide-react";
import { MenuCategoriesTab } from "@/components/pages/menu/categories/MenuCategoriesTab";
import { MenuProductsTab } from "@/components/pages/menu/products/MenuProductsTab";
import { MenuOptionGroupsTab } from "@/components/pages/menu/option-groups/MenuOptionGroupsTab";
import { MenuOptionsTab } from "@/components/pages/menu/options/MenuOptionsTab";
import { MenuAuditLogTab } from "@/components/pages/menu/audit/MenuAuditLogTab";
import { MenuValidationDialog } from "@/components/pages/menu/MenuValidationDialog";
import { MenuPublishDialog } from "@/components/pages/menu/MenuPublishDialog";
import { MenuProductRelationsTab } from "@/components/pages/menu/relations/MenuProductRelationsTab";

export const Route = createFileRoute("/_protected/menu/")({
  component: MenuPage,
});

function MenuPage() {
  const [activeTab, setActiveTab] = useState("categories");
  const workflowSteps = [
    {
      value: "categories",
      label: "التصنيفات",
      description: "تنظيم أقسام المنيو",
      icon: FolderOpen,
    },
    {
      value: "products",
      label: "المنتجات",
      description: "الأطباق والأسعار",
      icon: Package,
    },
    {
      value: "option-groups",
      label: "المجموعات",
      description: "قواعد الإضافات",
      icon: Layers,
    },
    {
      value: "options",
      label: "الخيارات",
      description: "الإضافات والبدائل",
      icon: Settings2,
    },
    {
      value: "relations",
      label: "الربط",
      description: "قواعد المنتج وخياراته",
      icon: Link2,
    },
    {
      value: "audit",
      label: "السجل",
      description: "آخر التغييرات",
      icon: FileText,
    },
  ];

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-4 py-6 lg:px-6" dir="rtl">
      <header className="flex flex-col gap-5 rounded-lg border bg-card p-5 shadow-xs lg:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex gap-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <BookOpen className="size-5" />
            </div>
            <div className="flex min-w-0 flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-semibold tracking-tight">
                  إدارة منيو الطلبات
                </h1>
              </div>
              <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                دورة واضحة لبناء القائمة: ابدأ بالتصنيفات، أضف المنتجات، اربط
                مجموعات الخيارات، راجع السجل، ثم تحقق وانشر.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <MenuValidationDialog />
            <MenuPublishDialog />
          </div>
        </div>

        <Separator />

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="flex items-center gap-3 rounded-lg bg-muted/40 p-3">
            <CheckCircle2 className="size-4 text-primary" />
            <div className="flex flex-col">
              <span className="text-sm font-medium">جاهزة للمراجعة</span>
              <span className="text-xs text-muted-foreground">
                تحقق من العلاقات قبل النشر
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-muted/40 p-3">
            <Layers className="size-4 text-primary" />
            <div className="flex flex-col">
              <span className="text-sm font-medium">دورة مترابطة</span>
              <span className="text-xs text-muted-foreground">
                التصنيفات والمنتجات والخيارات في مكان واحد
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-muted/40 p-3">
            <FileText className="size-4 text-primary" />
            <div className="flex flex-col">
              <span className="text-sm font-medium">تتبع التغييرات</span>
              <span className="text-xs text-muted-foreground">
                السجل يعرض آخر عمليات الإدارة
              </span>
            </div>
          </div>
        </div>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl">
        <div className="overflow-x-auto pb-1">
          <TabsList className="grid h-auto min-w-[900px] grid-cols-6 gap-1 bg-muted/70 p-1">
            {workflowSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <TabsTrigger
                  key={step.value}
                  value={step.value}
                  className="h-auto justify-start gap-3 rounded-md px-3 py-3 text-right data-[state=active]:bg-background data-[state=active]:shadow-xs"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-background text-xs font-semibold text-muted-foreground ring-1 ring-border data-[state=active]:text-primary">
                    {index + 1}
                  </span>
                  <Icon className="hidden size-4 text-muted-foreground sm:block" />
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="truncate text-sm font-medium">
                      {step.label}
                    </span>
                    <span className="truncate text-xs font-normal text-muted-foreground">
                      {step.description}
                    </span>
                  </span>
                </TabsTrigger>
              );
            })}
        </TabsList>
        </div>

        <TabsContent value="categories" className="mt-5">
          <MenuCategoriesTab />
        </TabsContent>
        <TabsContent value="products" className="mt-5">
          <MenuProductsTab />
        </TabsContent>
        <TabsContent value="option-groups" className="mt-5">
          <MenuOptionGroupsTab />
        </TabsContent>
        <TabsContent value="options" className="mt-5">
          <MenuOptionsTab />
        </TabsContent>
        <TabsContent value="relations" className="mt-5">
          <MenuProductRelationsTab />
        </TabsContent>
        <TabsContent value="audit" className="mt-5">
          <MenuAuditLogTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

import {
  FileText,
  FolderOpen,
  Layers,
  Link2,
  Package,
  PanelTopOpen,
  RotateCcw,
  Settings2,
} from "lucide-react";

const workflowSteps = [
  {
    value: "categories",
    label: "التصنيفات",
    description: "أقسام القائمة",
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
    label: "مجموعات الخيارات",
    description: "قواعد الاختيار",
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
    description: "خيارات كل منتج",
    icon: Link2,
  },
  {
    value: "public-preview",
    label: "معاينة العميل",
    description: "العقد الجديد",
    icon: PanelTopOpen,
  },
  {
    value: "audit",
    label: "السجل",
    description: "آخر التغييرات",
    icon: FileText,
  },
  {
    value: "versions",
    label: "الإصدارات",
    description: "النشر والاسترجاع",
    icon: RotateCcw,
  },
];

export { workflowSteps };

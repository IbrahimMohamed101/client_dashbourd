import {
  FileText,
  FolderOpen,
  Layers,
  Link2,
  Package,
  Settings2,
} from "lucide-react";

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

export { workflowSteps };

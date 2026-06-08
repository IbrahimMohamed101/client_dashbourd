import {
  FolderOpen,
  Layers,
  LayoutTemplate,
  PanelTopOpen,
  RotateCcw,
} from "lucide-react";

const workflowSteps = [
  {
    value: "catalog",
    label: "القائمة",
    description: "التصنيفات والمنتجات",
    icon: FolderOpen,
  },
  {
    value: "builder",
    label: "التخصيص",
    description: "الخيارات والربط",
    icon: Layers,
  },
  {
    value: "meal-builder",
    label: "منشئ الوجبات",
    description: "ترتيب وجبات الاشتراك",
    icon: LayoutTemplate,
  },
  {
    value: "preview",
    label: "المعاينة",
    description: "العميل والاشتراكات",
    icon: PanelTopOpen,
  },
  {
    value: "release",
    label: "النشر والسجل",
    description: "الإصدارات والتغييرات",
    icon: RotateCcw,
  },
];

const legacyMenuTabMap: Record<string, string> = {
  categories: "catalog",
  products: "catalog",
  "option-groups": "builder",
  options: "builder",
  relations: "builder",
  "meal-builder": "meal-builder",
  "public-preview": "preview",
  "meal-planner-preview": "preview",
  audit: "release",
  versions: "release",
};

export { legacyMenuTabMap, workflowSteps };

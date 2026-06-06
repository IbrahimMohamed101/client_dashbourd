import {
  FolderOpen,
  Layers,
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
  "public-preview": "preview",
  "meal-planner-preview": "preview",
  audit: "release",
  versions: "release",
};

export { legacyMenuTabMap, workflowSteps };

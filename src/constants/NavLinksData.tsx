import {
  LayoutDashboardIcon,
  Settings2Icon,
  CircleHelpIcon,
  Users,
  Boxes,
  CalendarPlus,
  ChefHat,
  UtensilsCrossed,
  PlusSquare,
  Utensils,
  Truck,
  FolderOpen,
  CreditCard,
  Ticket,
  MapPin,
} from "lucide-react";

export const NavLinksData = {
  navMain: [
    {
      title: "لوحة التحكم",
      url: "/dashboard",
      icon: <LayoutDashboardIcon />,
    },
    {
      title: "المدفوعات",
      url: "/payments",
      icon: <CreditCard />,
    },
    {
      title: "أكواد الخصم",
      url: "/promo-codes",
      icon: <Ticket />,
    },
    {
      title: "الوجبات",
      url: "/meals",
      icon: <Utensils />,
    },
    {
      title: "تصنيفات الوجبات",
      url: "/categories",
      icon: <FolderOpen />,
    },
    {
      title: "الوجبات المميزة",
      url: "/premium-meals",
      icon: <UtensilsCrossed />,
    },
    {
      title: "الإضافات",
      url: "/addons",
      icon: <PlusSquare />,
    },
    {
      title: "الباقات",
      url: "/packages",
      icon: <Boxes />,
    },
    {
      title: "الاشتراكات",
      url: "/subscriptions",
      icon: <CalendarPlus />,
    },
    {
      title: "عمليات المطبخ",
      url: "/orders",
      icon: <ChefHat />,
    },
    {
      title: "التوصيل",
      url: "/delivery",
      icon: <Truck />,
    },
    {
      title: "مناطق التوصيل",
      url: "/zones",
      icon: <MapPin />,
    },
    {
      title: "المستخدمين",
      url: "/users",
      icon: <Users />,
    },
  ],
  navSecondary: [
    {
      title: "الإعدادات",
      url: "#",
      icon: <Settings2Icon />,
    },
    {
      title: "المساعدة",
      url: "#",
      icon: <CircleHelpIcon />,
    },
  ],
};

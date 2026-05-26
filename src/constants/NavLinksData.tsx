import * as React from "react";
void React;

import {
  LayoutDashboardIcon,
  Settings2Icon,
  CircleHelpIcon,
  Users,
  Boxes,
  CalendarPlus,
  ChefHat,
  PlusSquare,
  Truck,
  CreditCard,
  Ticket,
  MapPin,
  BookOpen,
  MinusCircle,
  ShieldUser,
  ChartNoAxesCombined,
  ClipboardList,
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
      title: "المحاسبة",
      url: "/accounting",
      icon: <ChartNoAxesCombined />,
    },
    {
      title: "أكواد الخصم",
      url: "/promo-codes",
      icon: <Ticket />,
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
      title: "الطلبات",
      url: "/one-time-orders",
      icon: <ClipboardList />,
    },
    {
      title: "لوحة العمليات",
      url: "/operations",
      icon: <ChefHat />,
    },
    {
      title: "خصم يدوي",
      url: "/manual-deduction",
      icon: <MinusCircle />,
    },
    {
      title: "المنيو",
      url: "/menu",
      icon: <BookOpen />,
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
    {
      title: "مستخدمو اللوحة",
      url: "/dashboard-users",
      icon: <ShieldUser />,
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

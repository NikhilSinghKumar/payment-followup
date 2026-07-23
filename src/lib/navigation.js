import {
  LayoutDashboard,
  Building2,
  Users,
  FileText,
  IndianRupee,
  BellRing,
  Megaphone,
  Shield,
  KeyRound,
  BarChart3,
  Settings,
} from "lucide-react";

export const SIDEBAR_NAVIGATION = [
  {
    items: [
      {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
      },

      {
        title: "Clients",
        href: "/clients",
        icon: Users,
      },

      {
        title: "Invoices",
        href: "/invoices",
        icon: FileText,
      },

      {
        title: "Payments",
        href: "/payments",
        icon: IndianRupee,
      },

      {
        title: "Followups",
        href: "/followups",
        icon: Megaphone,
      },
    ],
  },

  {
    title: "Admin",

    items: [
      {
        title: "Companies",
        href: "/companies",
        icon: Building2,
      },

      {
        title: "Users",
        href: "/users",
        icon: Users,
      },

      {
        title: "Roles",
        href: "/roles",
        icon: Shield,
      },

      {
        title: "Permissions",
        href: "/permissions",
        icon: KeyRound,
      },
    ],
  },

  {
    title: "Analytics",

    items: [
      {
        title: "Reports",
        href: "/reports",
        icon: BarChart3,
      },
    ],
  },

  {
    title: "System",

    items: [
      {
        title: "Settings",
        href: "/settings",
        icon: Settings,
      },
    ],
  },
];

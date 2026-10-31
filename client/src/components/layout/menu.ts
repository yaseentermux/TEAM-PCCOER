import {
  LayoutDashboard,
  Users,
  Building2,
  Package,
  Calendar,
  Percent,
  Receipt,
  FileSpreadsheet,
  Repeat,
  CreditCard,
  BarChart3,
  type LucideIcon,
} from "lucide-react";
import type { UserRole } from "../../context/AuthContext";

export interface MenuItem {
  title: string;
  path: string;
  icon: LucideIcon;
  roles: UserRole[];
  badge?: string;
}

export interface MenuGroup {
  heading?: string;
  items: MenuItem[];
}

export const MENU_GROUPS: MenuGroup[] = [
  {
    items: [
      {
        title: "Dashboard",
        path: "/app/dashboard",
        icon: LayoutDashboard,
        roles: ["ADMIN", "INTERNAL"],
      },
    ],
  },
  {
    heading: "Administration",
    items: [
      {
        title: "Users & Staff",
        path: "/app/users",
        icon: Users,
        roles: ["ADMIN"],
      },
      {
        title: "Customers",
        path: "/app/customers",
        icon: Building2,
        roles: ["ADMIN", "INTERNAL"],
      },
    ],
  },
  {
    heading: "Catalog & Pricing",
    items: [
      {
        title: "Products",
        path: "/app/products",
        icon: Package,
        roles: ["ADMIN", "INTERNAL"],
      },
      {
        title: "Plans",
        path: "/app/plans",
        icon: Calendar,
        roles: ["ADMIN", "INTERNAL"],
      },
      {
        title: "Taxes",
        path: "/app/taxes",
        icon: Receipt,
        roles: ["ADMIN"],
      },
      {
        title: "Discounts",
        path: "/app/discounts",
        icon: Percent,
        roles: ["ADMIN", "INTERNAL"],
      },
    ],
  },
  {
    heading: "Sales & Contracts",
    items: [
      {
        title: "Templates",
        path: "/app/quotation-templates",
        icon: FileSpreadsheet,
        roles: ["ADMIN", "INTERNAL"],
      },
      {
        title: "Subscriptions",
        path: "/app/subscriptions",
        icon: Repeat,
        roles: ["ADMIN", "INTERNAL"],
      },
    ],
  },
  {
    heading: "Billing & Finance",
    items: [
      {
        title: "Invoices",
        path: "/app/invoices",
        icon: Receipt,
        roles: ["ADMIN", "INTERNAL"],
      },
      {
        title: "Payments",
        path: "/app/payments",
        icon: CreditCard,
        roles: ["ADMIN", "INTERNAL"],
      },
      {
        title: "Reports",
        path: "/app/reports",
        icon: BarChart3,
        roles: ["ADMIN"],
      },
    ],
  },
];

/**
 * Filter menu items according to user's database role.
 */
export function getFilteredMenuGroups(role?: UserRole): MenuGroup[] {
  if (!role) return [];

  return MENU_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => item.roles.includes(role)),
  })).filter((group) => group.items.length > 0);
}

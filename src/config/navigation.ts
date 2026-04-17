import {
  LayoutDashboard,
  FilePlus2,
  FileText,
  Library,
  ClipboardList,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const primaryNav: NavItem[] = [
  { href: "/prehled", label: "Přehled", icon: LayoutDashboard },
  { href: "/nova-uloha", label: "Nová úloha", icon: FilePlus2 },
  { href: "/moje-ulohy", label: "Moje úlohy", icon: FileText },
  { href: "/banka-uloh", label: "Banka úloh", icon: Library },
  { href: "/testy", label: "Testy", icon: ClipboardList },
];

export const secondaryNav: NavItem[] = [
  { href: "/nastaveni", label: "Nastavení", icon: Settings },
];

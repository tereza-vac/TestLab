import { Link, useLocation } from "react-router";
import { primaryNav, secondaryNav } from "@/config/navigation";
import { cn } from "@/lib/utils";
import { Beaker } from "lucide-react";

export function AppSidebar() {
  const { pathname } = useLocation();

  return (
    <aside className="flex h-full w-56 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="flex h-14 items-center gap-2 px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Beaker className="h-4 w-4" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold tracking-tight">TestLab</span>
          <span className="text-[11px] text-muted-foreground">
            Autorský nástroj
          </span>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3 py-2">
        {primaryNav.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}
      </nav>

      <div className="px-3 pb-3">
        <div className="mb-2 h-px w-full bg-sidebar-border" />
        {secondaryNav.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}
      </div>
    </aside>
  );
}

function NavLink({
  item,
  pathname,
}: {
  item: (typeof primaryNav)[number];
  pathname: string;
}) {
  const isActive =
    pathname === item.href || pathname.startsWith(item.href + "/");
  return (
    <Link
      to={item.href}
      className={cn(
        "flex h-9 items-center gap-2.5 rounded-lg px-3 text-sm font-medium transition-colors",
        isActive
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
      )}
    >
      <item.icon className="h-4 w-4" />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

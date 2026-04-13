import { ReactNode, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Menu,
  Newspaper,
  Image as ImageIcon,
  Clock3,
  ChevronRight,
  LogOut,
  Settings,
  UserCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

type NavItem = {
  label: string;
  href?: string;
  icon: typeof Newspaper;
  description?: string;
  soon?: boolean;
};

const navItems: NavItem[] = [
  {
    label: "Articles",
    href: "/admin",
    icon: Newspaper,
    description: "Manage drafts, published stories, and editorial placement",
  },
  {
    label: "Media",
    href: "/admin/media",
    icon: ImageIcon,
    description: "Upload and organize images and video assets",
  },
  {
    label: "Categories",
    icon: ChevronRight,
    description: "Taxonomy and organization tools",
    soon: true,
  },
  {
    label: "Settings",
    icon: Settings,
    description: "Workspace preferences and system controls",
    soon: true,
  },
];

interface AdminShellProps {
  children: ReactNode;
  pageTitle: string;
  pageDescription?: string;
  pageActions?: ReactNode;
  contentClassName?: string;
}

function ShellNav({
  onItemClick,
}: {
  onItemClick?: () => void;
}) {
  const location = useLocation();

  return (
    <nav className="space-y-1" aria-label="Main navigation">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = item.href
          ? item.href === "/admin"
            ? location.pathname === "/admin"
            : location.pathname.startsWith(item.href)
          : false;

        if (!item.href) {
          return (
            <div
              key={item.label}
              className="group flex items-center justify-between rounded-2xl border border-transparent px-3 py-3 text-sm text-sidebar-foreground/55"
            >
              <div className="flex items-center gap-3">
                <Icon className="h-4 w-4" />
                <div>
                  <div className="font-medium">{item.label}</div>
                  {item.description && (
                    <div className="mt-0.5 text-xs text-sidebar-foreground/45">
                      {item.description}
                    </div>
                  )}
                </div>
              </div>
              {item.soon && (
                <span className="rounded-full border border-sidebar-border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-sidebar-foreground/45">
                  Soon
                </span>
              )}
            </div>
          );
        }

        return (
          <NavLink
            key={item.label}
            to={item.href}
            onClick={onItemClick}
            className={cn(
              "group flex items-center gap-3 rounded-2xl border px-3 py-3 text-sm transition-colors",
              active
                ? "border-sidebar-border bg-sidebar-accent text-sidebar-foreground"
                : "border-transparent text-sidebar-foreground/70 hover:border-sidebar-border hover:bg-sidebar-accent/70 hover:text-sidebar-foreground",
            )}
          >
            <Icon
              className={cn(
                "h-4 w-4",
                active ? "text-primary" : "text-sidebar-foreground/45 group-hover:text-sidebar-foreground/70",
              )}
            />
            <div className="min-w-0">
              <div className="font-medium">{item.label}</div>
              {item.description && (
                <div className="mt-0.5 text-xs text-sidebar-foreground/45">
                  {item.description}
                </div>
              )}
            </div>
          </NavLink>
        );
      })}
    </nav>
  );
}

export function AdminShell({
  children,
  pageTitle,
  pageDescription,
  pageActions,
  contentClassName,
}: AdminShellProps) {
  const { admin, logout } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="blog-admin-shell min-h-screen bg-background text-foreground">
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col lg:border-r lg:border-sidebar-border lg:bg-sidebar">
        <div className="border-b border-sidebar-border px-6 py-6">
          <div className="inline-flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Newspaper className="h-5 w-5" />
            </div>
            <div>
              <div className="font-display text-lg font-semibold tracking-tight text-sidebar-foreground">
                VisiChek
              </div>
              <div className="text-xs uppercase tracking-[0.18em] text-sidebar-foreground/45">
                Blog Admin
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5">
          <ShellNav />
        </div>

        <div className="border-t border-sidebar-border px-4 py-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex w-full items-center gap-3 rounded-2xl border border-sidebar-border bg-sidebar-accent/75 px-3 py-3 text-left transition-colors hover:bg-sidebar-accent">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <UserCircle2 className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-sidebar-foreground">
                    {admin?.full_name ?? "Admin"}
                  </div>
                  <div className="truncate text-xs text-sidebar-foreground/45">
                    {admin?.email ?? "Content workspace"}
                  </div>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>Workspace</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled>
                <Clock3 className="mr-2 h-4 w-4" />
                Publishing desk
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-40 border-b border-border/70 bg-background/92 backdrop-blur">
          <div className="flex h-16 items-center gap-4 px-4 lg:px-8">
            <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[88vw] max-w-sm border-r border-sidebar-border bg-sidebar p-0">
                <SheetHeader className="border-b border-sidebar-border px-6 py-6 text-left">
                  <SheetTitle className="font-display text-xl">VisiChek Blog Admin</SheetTitle>
                </SheetHeader>
                <div className="px-4 py-5">
                  <ShellNav onItemClick={() => setMobileNavOpen(false)} />
                </div>
              </SheetContent>
            </Sheet>

            <div className="min-w-0 flex-1">
              <div className="font-display text-lg font-semibold tracking-tight text-foreground">
                {pageTitle}
              </div>
              {pageDescription && (
                <div className="hidden text-sm text-muted-foreground md:block">
                  {pageDescription}
                </div>
              )}
            </div>

            <div className="hidden items-center gap-2 md:flex">{pageActions}</div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-10 rounded-full px-3">
                  <UserCircle2 className="h-4 w-4" />
                  <span className="hidden sm:inline">{admin?.full_name?.split(" ")[0] ?? "Admin"}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel className="space-y-0.5">
                  <div>{admin?.full_name ?? "Admin"}</div>
                  <div className="text-xs font-normal text-muted-foreground">
                    {admin?.email ?? ""}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className={cn("px-4 py-6 lg:px-8 lg:py-8", contentClassName)}>
          {children}
        </main>
      </div>
    </div>
  );
}

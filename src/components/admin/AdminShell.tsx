import { ReactNode, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  ChevronUp,
  HelpCircle,
  Image as ImageIcon,
  LogOut,
  Menu,
  Newspaper,
  PanelLeft,
  PanelLeftClose,
  Settings,
  ShieldCheck,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import { InviteAdminDialog } from "@/components/admin/InviteAdminDialog";
import { MfaSettingsDialog } from "@/components/admin/MfaSettingsDialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

type NavItem = {
  label: string;
  href?: string;
  icon: LucideIcon;
  description?: string;
  soon?: boolean;
};

const navItems: NavItem[] = [
  {
    label: "Articles",
    href: "/admin",
    icon: Newspaper,
    description: "Drafts, published stories, and editorial placement",
  },
  {
    label: "Media",
    href: "/admin/media",
    icon: ImageIcon,
    description: "Upload and organize images and video assets",
  },
  {
    label: "Categories",
    icon: Settings,
    description: "Taxonomy and organization — coming soon",
    soon: true,
  },
];

interface AdminShellProps {
  children: ReactNode;
  pageTitle: string;
  pageDescription?: string;
  pageActions?: ReactNode;
  contentClassName?: string;
  /**
   * "default" — standard dashboard layout with padded content.
   * "focus"  — edge-to-edge canvas (used by the editor). Sidebar starts collapsed;
   *            content area has no page padding so callers control their own gutters.
   */
  variant?: "default" | "focus";
}

function isActivePath(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname.startsWith(href);
}

function DesktopSidebar({
  collapsed,
  onCollapsedChange,
  onInvite,
  onMfa,
}: {
  collapsed: boolean;
  onCollapsedChange: (v: boolean) => void;
  onInvite: () => void;
  onMfa: () => void;
}) {
  const { admin, logout } = useAuth();
  const location = useLocation();

  return (
    <aside
      className={cn(
        "hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 border-r border-sidebar-border bg-sidebar transition-[width] duration-200 ease-in-out",
        collapsed ? "lg:w-16" : "lg:w-64",
      )}
    >
      {/* Header: brand + collapse toggle */}
      <div
        className={cn(
          "flex h-14 items-center",
          collapsed ? "justify-center px-2" : "justify-between px-5",
        )}
      >
        {!collapsed && (
          <div>
            <div className="font-display text-lg font-semibold tracking-tight text-sidebar-foreground">
              VisiChek
            </div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-sidebar-foreground/50">
              Blog Admin
            </div>
          </div>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => onCollapsedChange(!collapsed)}
              className={cn(
                "flex items-center justify-center rounded-md p-1.5 text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors",
                "min-h-[32px] min-w-[32px]",
              )}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? (
                <PanelLeft className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">
            {collapsed ? "Expand sidebar" : "Collapse sidebar"}
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Nav */}
      <nav
        className={cn(
          "flex-1 overflow-y-auto py-2",
          collapsed ? "px-2" : "px-3",
        )}
        aria-label="Main navigation"
      >
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isLink = Boolean(item.href);
            const active = item.href
              ? isActivePath(location.pathname, item.href)
              : false;

            const sharedClasses = cn(
              "group flex items-center rounded-lg text-sm font-medium transition-colors",
              collapsed
                ? "justify-center p-2 min-h-[40px]"
                : "gap-3 px-3 py-2 min-h-[40px]",
              active
                ? "bg-sidebar-accent text-sidebar-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
              !isLink && "cursor-not-allowed opacity-60 hover:bg-transparent",
            );

            const body = (
              <>
                <Icon
                  className={cn(
                    "h-[18px] w-[18px] shrink-0 transition-colors",
                    active
                      ? "text-sidebar-foreground"
                      : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground/80",
                  )}
                  aria-hidden="true"
                />
                {!collapsed && (
                  <>
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.soon && (
                      <span className="ml-auto rounded-full border border-sidebar-border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/50">
                        Soon
                      </span>
                    )}
                  </>
                )}
              </>
            );

            return (
              <li key={item.label}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    {isLink ? (
                      <NavLink
                        to={item.href as string}
                        className={sharedClasses}
                        aria-current={active ? "page" : undefined}
                      >
                        {body}
                      </NavLink>
                    ) : (
                      <div className={sharedClasses} aria-disabled="true">
                        {body}
                      </div>
                    )}
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-[220px]">
                    {collapsed ? (
                      <div>
                        <div className="font-medium">{item.label}</div>
                        {item.description && (
                          <div className="mt-0.5 text-xs opacity-80">
                            {item.description}
                          </div>
                        )}
                      </div>
                    ) : (
                      item.description || item.label
                    )}
                  </TooltipContent>
                </Tooltip>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User footer */}
      <div
        className={cn(
          "border-t border-sidebar-border",
          collapsed ? "px-2 py-2" : "px-3 py-2",
        )}
      >
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    "flex items-center w-full rounded-lg transition-colors",
                    "hover:bg-sidebar-accent text-sidebar-foreground",
                    collapsed
                      ? "justify-center p-2 min-h-[44px]"
                      : "gap-3 px-3 py-2.5 min-h-[44px]",
                  )}
                >
                  <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold">
                    {(admin?.full_name?.charAt(0) ?? "A").toUpperCase()}
                  </div>

                  {!collapsed && (
                    <>
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-sm font-medium leading-tight truncate">
                          {admin?.full_name ?? "Admin"}
                        </p>
                        {admin?.email && (
                          <p className="text-xs text-sidebar-foreground/50 leading-tight truncate mt-0.5">
                            {admin.email}
                          </p>
                        )}
                      </div>
                      <ChevronUp className="h-4 w-4 shrink-0 text-sidebar-foreground/40" />
                    </>
                  )}
                </button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side={collapsed ? "right" : "top"}>
              Open account menu
            </TooltipContent>
          </Tooltip>

          <DropdownMenuContent
            side={collapsed ? "right" : "top"}
            align="start"
            sideOffset={8}
            className="w-56"
          >
            <div className="px-2 py-2">
              <p className="text-sm font-medium truncate">
                {admin?.full_name ?? "Admin"}
              </p>
              {admin?.email && (
                <p className="text-xs text-muted-foreground truncate">
                  {admin.email}
                </p>
              )}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onInvite} className="gap-2 min-h-[36px]">
              <UserPlus className="h-4 w-4" />
              Invite admin
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onMfa} className="gap-2 min-h-[36px]">
              <ShieldCheck className="h-4 w-4" />
              {admin?.mfa_enabled ? "Manage 2FA" : "Enable 2FA"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled className="gap-2 min-h-[36px]">
              <HelpCircle className="h-4 w-4" />
              Get help
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={logout}
              className="gap-2 min-h-[36px] text-destructive focus:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}

function MobileNav({ onClose }: { onClose: () => void }) {
  const location = useLocation();

  return (
    <nav className="space-y-1 px-4 py-5" aria-label="Main navigation">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = item.href
          ? isActivePath(location.pathname, item.href)
          : false;

        const classes = cn(
          "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
          active
            ? "bg-sidebar-accent text-sidebar-foreground"
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
          !item.href && "cursor-not-allowed opacity-60",
        );

        if (!item.href) {
          return (
            <div key={item.label} className={classes} aria-disabled="true">
              <Icon className="h-[18px] w-[18px] shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.soon && (
                <span className="rounded-full border border-sidebar-border px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-sidebar-foreground/50">
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
            onClick={onClose}
            className={classes}
          >
            <Icon className="h-[18px] w-[18px] shrink-0" />
            <span>{item.label}</span>
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
  variant = "default",
}: AdminShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(variant === "focus");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [mfaOpen, setMfaOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <DesktopSidebar
        collapsed={collapsed}
        onCollapsedChange={setCollapsed}
        onInvite={() => setInviteOpen(true)}
        onMfa={() => setMfaOpen(true)}
      />
      <InviteAdminDialog open={inviteOpen} onOpenChange={setInviteOpen} />
      <MfaSettingsDialog open={mfaOpen} onOpenChange={setMfaOpen} />

      <div className={cn(collapsed ? "lg:pl-16" : "lg:pl-64")}>
        <header className="sticky top-0 z-sticky flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6">
          <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden min-h-[44px] min-w-[44px]"
                aria-label="Open navigation menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-[88vw] max-w-sm border-r border-sidebar-border bg-sidebar p-0"
            >
              <SheetHeader className="border-b border-sidebar-border px-6 py-6 text-left">
                <SheetTitle className="font-display text-xl">
                  VisiChek Blog Admin
                </SheetTitle>
              </SheetHeader>
              <MobileNav onClose={() => setMobileNavOpen(false)} />
            </SheetContent>
          </Sheet>

          <div className="min-w-0 flex-1">
            <div className="font-display text-base font-semibold tracking-tight text-foreground truncate">
              {pageTitle}
            </div>
            {pageDescription && (
              <div className="hidden truncate text-xs text-muted-foreground md:block">
                {pageDescription}
              </div>
            )}
          </div>

          {pageActions && (
            <div className="hidden items-center gap-2 md:flex">{pageActions}</div>
          )}
        </header>

        <main
          className={cn(
            variant === "focus" ? "py-0" : "px-4 py-6 lg:px-8 lg:py-8",
            contentClassName,
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

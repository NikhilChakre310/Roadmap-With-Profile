import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import {
  BarChart3,
  BookOpen,
  CalendarCheck,
  Code2,
  FolderKanban,
  Github,
  LayoutDashboard,
  Library,
  LogOut,
  Map,
  Menu,
  NotebookPen,
  Settings,
  User,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/data";
import { cn } from "@/lib/utils";

export const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/roadmap", label: "My Roadmap", icon: Map },
  { to: "/daily", label: "Daily Tracker", icon: CalendarCheck },
  { to: "/dsa", label: "DSA / LeetCode", icon: Code2 },
  { to: "/projects", label: "Projects & Milestones", icon: FolderKanban },
  { to: "/github", label: "GitHub Tracker", icon: Github },
  { to: "/resources", label: "Learning Resources", icon: Library },
  { to: "/reviews", label: "Weekly Reviews", icon: NotebookPen },
  { to: "/analytics", label: "Progress Analytics", icon: BarChart3 },
  { to: "/profile", label: "Developer Profile", icon: User },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { data: session, isLoading } = useSession();
  const qc = useQueryClient();
  const loc = useLocation();
  const nav = useNavigate();

  useEffect(() => {
    setMounted(true);
    const t = localStorage.getItem("theme");
    document.documentElement.classList.toggle("light", t === "light");
    const { data } = supabase.auth.onAuthStateChange((_e, s) => {
      qc.setQueryData(["session"], s);
      if (!s) qc.removeQueries({ queryKey: ["rows"] });
    });
    return () => data.subscription.unsubscribe();
  }, [qc]);

  useEffect(() => setOpen(false), [loc.pathname]);

  const isLogin = loc.pathname === "/login";
  useEffect(() => {
    if (!mounted || isLoading) return;
    if (!session && !isLogin) nav({ to: "/login" });
    if (session && isLogin) nav({ to: "/" });
  }, [mounted, isLoading, session, isLogin, nav]);

  if (isLogin) return <>{children}</>;
  if (!mounted || isLoading || !session)
    return (
      <div className="flex min-h-screen items-center justify-center stat-label">
        Loading DevRoadmap…
      </div>
    );

  const sidebar = (
    <nav className="flex h-full flex-col gap-1 p-3">
      <div className="mb-4 flex items-center gap-2 px-2 pt-1">
        <div className="h-6 w-6 rounded-md glow-line" />
        {!collapsed && <span className="font-display text-lg font-semibold">DevRoadmap</span>}
      </div>
      {NAV.map((n) => {
        const active = n.to === "/" ? loc.pathname === "/" : loc.pathname.startsWith(n.to);
        return (
          <Link
            key={n.to}
            to={n.to}
            title={n.label}
            className={cn(
              "flex items-center gap-3 rounded-md px-2.5 py-2 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent",
              active && "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
            )}
          >
            <n.icon className={cn("h-4 w-4 shrink-0", active && "text-primary")} />
            {!collapsed && n.label}
          </Link>
        );
      })}
      <div className="mt-auto space-y-1">
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="hidden w-full items-center gap-3 rounded-md px-2.5 py-2 text-sm text-muted-foreground hover:bg-sidebar-accent lg:flex"
        >
          <Menu className="h-4 w-4" />
          {!collapsed && "Collapse"}
        </button>
        <button
          onClick={() => supabase.auth.signOut()}
          className="flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-sm text-muted-foreground hover:bg-sidebar-accent"
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && "Sign out"}
        </button>
      </div>
    </nav>
  );

  return (
    <div className="flex min-h-screen">
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 border-r border-sidebar-border bg-sidebar lg:block",
          collapsed ? "w-16" : "w-60",
        )}
      >
        {sidebar}
      </aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-background/80" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 border-r border-sidebar-border bg-sidebar">
            <button
              className="absolute right-3 top-3"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </button>
            {sidebar}
          </aside>
        </div>
      )}
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-40 flex items-center gap-3 border-b bg-background/90 px-4 py-3 backdrop-blur lg:hidden">
          <button onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-display font-semibold">DevRoadmap</span>
          <BookOpen className="ml-auto h-4 w-4 text-primary" />
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 md:px-8">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  sub,
  children,
}: {
  title: string;
  sub?: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        {sub && <p className="mt-1 text-sm text-muted-foreground">{sub}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}

export function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <div className="panel p-4">
      <div className="stat-label">{label}</div>
      <div className="mt-1.5 font-display text-2xl font-semibold">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}

export function Bar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-muted", className)}>
      <div
        className="h-full glow-line transition-all"
        style={{ width: `${Math.min(100, value)}%` }}
      />
    </div>
  );
}

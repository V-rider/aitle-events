import {
  CalendarDays,
  LayoutDashboard,
  LogOut,
  Settings,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { cn, initials } from "@/lib/utils";

interface Me {
  user: { email: string; name: string } | null;
  admin: boolean;
}

const links = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/events", label: "Events", icon: CalendarDays },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminLayout() {
  const navigate = useNavigate();
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    api
      .get<Me>("/api/auth/me")
      .then((data) => {
        if (!data.user || !data.admin) {
          navigate("/admin", { replace: true });
          return;
        }
        setMe(data);
      })
      .catch(() => navigate("/admin", { replace: true }));
  }, [navigate]);

  async function logout() {
    await api.post("/api/auth/logout");
    navigate("/admin");
  }

  if (!me?.user) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-muted-foreground">
        Loading…
      </div>
    );
  }

  return (
    <div className="admin-shell flex bg-background lg:min-h-dvh lg:pb-0">
      <aside className="hidden w-64 shrink-0 flex-col border-r bg-white lg:flex">
        <div className="border-b p-5">
          <img src="/aitle-logo.png" alt="AiTLE" className="mb-3 h-8 w-auto" />
          <p className="text-[11px] leading-snug text-muted-foreground">
            Association of I.T. Leaders in Education
            <br />
            資訊科技教育領袖協會
          </p>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors",
                  isActive
                    ? "border-l-2 border-primary bg-sky-soft/70 font-medium text-primary"
                    : "text-slate-600 hover:bg-muted",
                )
              }
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-3 border-t p-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-medium text-white">
            {initials(me.user.name || me.user.email)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">{me.user.name}</div>
            <div className="truncate text-[11px] text-muted-foreground">{me.user.email}</div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="text-muted-foreground hover:text-foreground"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b bg-white/90 px-4 py-3 backdrop-blur-xl lg:hidden">
          <div className="flex min-w-0 items-center gap-3">
            <img src="/aitle-logo.png" alt="AiTLE" className="h-7 w-auto" />
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">Admin Console</div>
              <div className="truncate text-[11px] text-muted-foreground">{me.user.email}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="rounded-lg border px-2.5 py-2 text-muted-foreground"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-5 sm:px-6 sm:py-8">
          <Outlet />
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-white/95 backdrop-blur-xl lg:hidden safe-bottom">
        <div className="mx-auto grid max-w-lg grid-cols-4 px-1 pt-1.5">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center gap-1 rounded-xl px-1 py-2 text-[10px] font-medium transition-colors sm:text-[11px]",
                  isActive ? "bg-sky-soft text-primary" : "text-muted-foreground",
                )
              }
            >
              <link.icon className="h-5 w-5" />
              {link.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}

import { CalendarDays, Search, Shield } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

const items = [
  { to: "/", label: "Events", icon: CalendarDays, end: true },
  { to: "/attendance-lookup", label: "Attendance", icon: Search, end: false },
  { to: "/admin", label: "Admin", icon: Shield, end: false },
];

export function PublicBottomBar() {
  return (
    <nav className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-navy-950/95 text-white backdrop-blur-xl md:hidden safe-bottom">
      <div className="mx-auto grid max-w-lg grid-cols-3 px-2 pt-2">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium transition-colors",
                isActive ? "bg-white/10 text-white" : "text-white/65 hover:text-white",
              )
            }
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

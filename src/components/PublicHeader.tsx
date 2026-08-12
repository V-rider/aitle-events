import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { PageMotion } from "@/components/PageMotion";
import { PublicBottomBar } from "@/components/PublicBottomBar";
import { cn } from "@/lib/utils";

export function PublicHeader({
  onHome,
  transparent = false,
}: {
  onHome?: () => void;
  transparent?: boolean;
}) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 1);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-30 no-print",
        transparent
          ? cn(
              "bg-navy-950 text-white backdrop-blur-xl",
              scrolled ? "border-b border-white/10" : "border-b border-transparent",
            )
          : cn(
              "bg-white",
              scrolled ? "border-b border-border" : "border-b border-transparent",
            ),
      )}
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-6">
        <Link to="/" onClick={onHome} className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <img
            src="/aitle-logo.png"
            alt="AiTLE"
            className={cn("h-7 w-auto shrink-0 sm:h-8", transparent && "brightness-0 invert")}
          />
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold leading-tight">AiTLE Events</div>
            <div
              className={cn(
                "hidden truncate text-[11px] sm:block",
                transparent ? "text-white/70" : "text-muted-foreground",
              )}
            >
              資訊科技教育領袖協會
            </div>
          </div>
        </Link>
        <nav className="flex shrink-0 items-center gap-1.5 sm:gap-2 text-sm">
          <Link
            to="/attendance-lookup"
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 transition-colors sm:px-3",
              transparent
                ? "hover:bg-white/10"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
            aria-label="My Attendance"
          >
            <Search className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">My Attendance</span>
          </Link>
          <Link
            to="/admin"
            className={cn(
              "rounded-xl px-3 py-2 font-medium transition duration-200 hover:-translate-y-0.5 sm:px-3.5",
              transparent
                ? "bg-white text-navy-950 hover:bg-white/90"
                : "border border-border bg-white text-foreground hover:border-primary/30 hover:bg-muted",
            )}
          >
            Admin
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function PublicShell({
  children,
  transparentHeader = false,
  className,
  animate = true,
}: {
  children: React.ReactNode;
  transparentHeader?: boolean;
  className?: string;
  /** When false, skip shell-level enter (pages with custom staggered motion). */
  animate?: boolean;
}) {
  const location = useLocation();

  return (
    <div className={cn("page-shell", className)}>
      <PublicHeader transparent={transparentHeader} />
      {animate ? (
        <PageMotion key={location.pathname} className="min-w-0 flex-1">
          {children}
        </PageMotion>
      ) : (
        children
      )}
      <PublicBottomBar />
    </div>
  );
}

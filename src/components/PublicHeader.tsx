import { Link } from "react-router-dom";
import { PublicBottomBar } from "@/components/PublicBottomBar";
import { cn } from "@/lib/utils";

export function PublicHeader({
  onHome,
  transparent = false,
}: {
  onHome?: () => void;
  transparent?: boolean;
}) {
  return (
    <header
      className={cn(
        "sticky top-0 z-30 no-print",
        transparent
          ? "bg-navy-950/70 text-white border-b border-white/10 backdrop-blur-xl"
          : "bg-white/90 border-b backdrop-blur-xl",
      )}
    >
      <div className="container mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link to="/" onClick={onHome} className="flex min-w-0 items-center gap-3">
          <img
            src="/aitle-logo.png"
            alt="AiTLE"
            className={cn("h-8 w-auto", transparent && "brightness-0 invert")}
          />
          <div className="hidden min-w-0 sm:block">
            <div className="text-sm font-semibold leading-tight">AiTLE Events</div>
            <div
              className={cn(
                "truncate text-[11px]",
                transparent ? "text-white/70" : "text-muted-foreground",
              )}
            >
              資訊科技教育領袖協會
            </div>
          </div>
        </Link>
        <nav className="hidden items-center gap-1 text-sm md:flex">
          <Link
            to="/"
            className={cn(
              "rounded-lg px-3 py-2 transition-colors",
              transparent ? "hover:bg-white/10" : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            Events
          </Link>
          <Link
            to="/attendance-lookup"
            className={cn(
              "rounded-lg px-3 py-2 transition-colors",
              transparent ? "hover:bg-white/10" : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            Attendance
          </Link>
          <Link
            to="/admin"
            className={cn(
              "rounded-lg px-3 py-2 font-medium transition-colors",
              transparent
                ? "bg-white text-navy-950 hover:bg-white/90"
                : "bg-primary text-primary-foreground hover:bg-primary/90",
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
}: {
  children: React.ReactNode;
  transparentHeader?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("page-shell", className)}>
      <PublicHeader transparent={transparentHeader} />
      {children}
      <PublicBottomBar />
    </div>
  );
}

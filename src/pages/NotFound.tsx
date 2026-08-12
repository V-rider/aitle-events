import { Link } from "react-router-dom";
import { PublicShell } from "@/components/PublicHeader";
import { Button } from "@/components/ui/button";

export function NotFound() {
  return (
    <PublicShell animate={false}>
      <div className="flex min-h-[60vh] items-center justify-center px-4 text-center">
        <div>
          <h1 className="animate-fade-up text-2xl font-semibold">Page not found</h1>
          <p className="animate-fade-up-delay mt-2 text-sm text-muted-foreground">
            That link doesn’t match an AiTLE Events page.
          </p>
          <Button
            className="animate-fade-up-delay-2 mt-6 transition duration-200 hover:-translate-y-0.5"
            asChild
          >
            <Link to="/">Back home</Link>
          </Button>
        </div>
      </div>
    </PublicShell>
  );
}

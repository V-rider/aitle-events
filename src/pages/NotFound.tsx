import { Link } from "react-router-dom";
import { PublicShell } from "@/components/PublicHeader";
import { Button } from "@/components/ui/button";

export function NotFound() {
  return (
    <PublicShell>
      <div className="flex min-h-[60vh] items-center justify-center px-4 text-center">
        <div>
          <h1 className="text-2xl font-semibold">Page not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            That link doesn’t match an AiTLE Events page.
          </p>
          <Button className="mt-6" asChild>
            <Link to="/">Back home</Link>
          </Button>
        </div>
      </div>
    </PublicShell>
  );
}

import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PublicShell } from "@/components/PublicHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";

export function AdminLogin() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [googleConfigured, setGoogleConfigured] = useState(true);
  const [email, setEmail] = useState("");
  const [error, setError] = useState(params.get("error"));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api
      .get<{ user: unknown; admin: boolean; googleConfigured: boolean }>("/api/auth/me")
      .then((me) => {
        if (me.user && me.admin) navigate("/admin/dashboard", { replace: true });
        setGoogleConfigured(me.googleConfigured);
      })
      .catch(() => setGoogleConfigured(false));
  }, [navigate]);

  async function devLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.post("/api/auth/dev-login", { email });
      navigate("/admin/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PublicShell animate={false} className="bg-gradient-to-b from-navy-950 via-navy-900 to-background">
      <div className="flex justify-center px-4 py-10 sm:py-16">
        <div className="motion-card w-full max-w-md rounded-2xl border bg-white p-6 shadow-xl sm:p-8">
          <img src="/aitle-logo.png" alt="AiTLE" className="animate-fade-up mb-4 h-8 w-auto" />
          <h1 className="animate-fade-up-delay text-2xl font-bold tracking-tight">Admin sign-in</h1>
          <p className="animate-fade-up-delay-2 mt-1 text-sm text-muted-foreground">
            Manage events, attendance, and certificates for AiTLE.
          </p>
          <div className="animate-fade-up-delay-3 mt-6 space-y-4">
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            {googleConfigured ? (
              <Button className="h-11 w-full transition duration-200 hover:-translate-y-0.5" asChild>
                <a href="/api/auth/google">Continue with Google</a>
              </Button>
            ) : (
              <form className="space-y-3" onSubmit={devLogin}>
                <p className="text-sm text-muted-foreground">
                  Google OAuth is not configured. Use an invited admin email for local sign-in.
                </p>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Admin email</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    className="h-11"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jasperlee016@gmail.com"
                  />
                </div>
                <Button
                  type="submit"
                  className="h-11 w-full transition duration-200 hover:-translate-y-0.5"
                  disabled={loading}
                >
                  {loading ? "Signing in…" : "Sign in"}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </PublicShell>
  );
}

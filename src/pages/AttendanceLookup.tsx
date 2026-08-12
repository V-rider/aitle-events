import { Award, Search } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { FadeIn, PageMotion } from "@/components/PageMotion";
import { PublicBottomBar } from "@/components/PublicBottomBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

interface RecordItem {
  registrationId: string;
  name: string;
  eventTitle: string;
  dateLabel: string;
  location: string;
  attended: boolean;
}

export function AttendanceLookup() {
  const [q, setQ] = useState("");
  const [records, setRecords] = useState<RecordItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function search(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<{ records: RecordItem[] }>(
        `/api/attendance?q=${encodeURIComponent(q)}`,
      );
      setRecords(res.records);
    } catch {
      setError("Search failed. Please try again.");
      setRecords(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-shell bg-white">
      <header className="sticky top-0 z-30 border-b bg-white/95 backdrop-blur no-print">
        <div className="flex w-full items-center justify-between gap-3 px-4 py-3.5 sm:px-6 lg:px-8">
          <Link to="/" className="flex min-w-0 items-center gap-2.5">
            <img src="/aitle-logo.png" alt="AiTLE" className="h-7 w-auto shrink-0 sm:h-8" />
            <span className="truncate text-sm font-semibold">AiTLE Events</span>
          </Link>
          <Link
            to="/"
            className="shrink-0 text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
          >
            Browse Events
          </Link>
        </div>
      </header>

      <PageMotion>
        <main className="container mx-auto max-w-2xl px-4 pb-8 pt-10 sm:pt-14">
          <FadeIn className="text-center">
            <h1
              className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              Attendance Lookup
            </h1>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
              Enter your email address or phone number to view your attendance history across all
              events.
            </p>
          </FadeIn>

          <FadeIn delay={0.1} className="mt-8">
            <form onSubmit={search} className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
              <div className="relative min-w-0 flex-1">
                <Search
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Enter email or phone number..."
                  required
                  className="h-12 rounded-lg border-border/80 bg-white pl-10 shadow-none"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="h-12 shrink-0 rounded-lg bg-[#0f2f6b] px-6 text-sm font-medium transition duration-200 hover:-translate-y-0.5 hover:bg-[#0c2758] sm:min-w-[7.5rem]"
              >
                {loading ? "Searching…" : "Search"}
              </Button>
            </form>
          </FadeIn>

          {error ? (
            <p className="mt-4 text-center text-sm text-destructive">{error}</p>
          ) : null}

          <FadeIn delay={0.18} className="mt-8">
            {records === null ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border px-6 py-14 text-center sm:py-16">
                <Search
                  className="mb-4 h-14 w-14 text-muted-foreground/25"
                  strokeWidth={1.25}
                  aria-hidden
                />
                <p className="text-base font-semibold text-foreground">
                  Enter your contact details to search
                </p>
                <p className="mt-1.5 max-w-xs text-sm text-muted-foreground">
                  Use the email or phone number you registered with.
                </p>
              </div>
            ) : records.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border px-6 py-12 text-center">
                <p className="font-semibold text-foreground">No records found</p>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Check the email or phone number and try again.
                </p>
              </div>
            ) : (
              <div className="stagger-children space-y-3">
                {records.map((r) => (
                  <div
                    key={r.registrationId}
                    className="motion-card rounded-xl border border-border/80 bg-white p-4 sm:p-5"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="font-semibold leading-snug text-foreground">
                          {r.eventTitle}
                        </div>
                        <div className="mt-1 text-sm text-muted-foreground">{r.dateLabel}</div>
                        {r.location ? (
                          <div className="mt-0.5 text-sm text-muted-foreground">{r.location}</div>
                        ) : null}
                        <div className="mt-2 text-xs text-muted-foreground">
                          ID #{r.registrationId} · {r.attended ? "Attended" : "Registered"}
                        </div>
                      </div>
                      {r.attended ? (
                        <Button size="sm" variant="outline" className="w-full sm:w-auto" asChild>
                          <Link to={`/certificate/${r.registrationId}`}>
                            <Award className="h-4 w-4" />
                            Certificate
                          </Link>
                        </Button>
                      ) : (
                        <span className="inline-flex w-fit rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                          Pending attendance
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </FadeIn>
        </main>
      </PageMotion>

      <PublicBottomBar />
    </div>
  );
}

import { ArrowRight, Calendar, MapPin, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PublicShell } from "@/components/PublicHeader";
import { api } from "@/lib/api";
import type { EventItem } from "@/lib/types";
import { cn } from "@/lib/utils";

export function Home() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ events: EventItem[] }>("/api/events")
      .then((d) => setEvents(d.events))
      .finally(() => setLoading(false));
  }, []);

  const now = Date.now();
  const upcoming = events.filter((e) => new Date(e.endAt || e.startAt).getTime() >= now);
  const past = events.filter((e) => new Date(e.endAt || e.startAt).getTime() < now);

  return (
    <PublicShell transparentHeader className="bg-navy-950">
      <section className="relative overflow-hidden bg-navy-950 text-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="hero-glow absolute -left-24 top-0 h-72 w-72 rounded-full bg-sky-400/20 blur-3xl" />
          <div className="hero-orb absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />
          <div
            className="absolute inset-0 opacity-[0.18]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.35) 1px, transparent 0)",
              backgroundSize: "28px 28px",
            }}
          />
        </div>

        <div className="relative container mx-auto max-w-5xl px-4 pb-14 pt-10 sm:pb-20 sm:pt-16">
          <img
            src="/aitle-logo.png"
            alt="AiTLE — Association of I.T. Leaders in Education"
            className="animate-fade-up mb-6 h-11 w-auto brightness-0 invert sm:h-14"
          />
          <p className="animate-fade-up-delay mb-3 text-xs uppercase tracking-[0.28em] text-sky-200/90 sm:text-sm">
            資訊科技教育領袖協會
          </p>
          <h1
            className="animate-fade-up-delay max-w-3xl text-3xl font-bold leading-tight tracking-tight sm:text-5xl"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Register. Attend.
            <br />
            Track Your Journey.
          </h1>
          <p className="animate-fade-up-delay-2 mt-4 max-w-xl text-sm leading-relaxed text-white/75 sm:text-base">
            Event registration and certificates for AiTLE educators across Hong Kong and Macau.
          </p>
          <div className="animate-fade-up-delay-2 mt-8 flex flex-wrap gap-3">
            <a
              href="#upcoming"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-navy-950 transition hover:bg-sky-soft"
            >
              Browse events
              <ArrowRight className="h-4 w-4" />
            </a>
            <Link
              to="/attendance-lookup"
              className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/5 px-4 py-2.5 text-sm font-medium text-white backdrop-blur transition hover:bg-white/10"
            >
              <Search className="h-4 w-4" />
              Attendance lookup
            </Link>
          </div>
        </div>
      </section>

      <div className="rounded-t-[1.5rem] bg-background -mt-4 relative z-10 sm:rounded-t-[2rem]">
        <div className="container mx-auto max-w-5xl space-y-10 px-4 py-8 sm:py-12">
          <EventSection
            id="upcoming"
            title="Upcoming Events"
            events={upcoming}
            loading={loading}
            empty="No events available yet. Check back soon for upcoming events."
          />
          <EventSection
            title="Past Events"
            events={past}
            loading={false}
            empty="No past events yet."
            past
          />
        </div>
      </div>
    </PublicShell>
  );
}

function EventSection({
  id,
  title,
  events,
  loading,
  empty,
  past,
}: {
  id?: string;
  title: string;
  events: EventItem[];
  loading: boolean;
  empty: string;
  past?: boolean;
}) {
  return (
    <section id={id}>
      <div className="mb-4 flex items-end justify-between gap-3">
        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h2>
        {!loading ? (
          <span className="text-xs text-muted-foreground">{events.length} listed</span>
        ) : null}
      </div>
      {loading ? (
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-white/80" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-white/70 px-5 py-10 text-center text-sm text-muted-foreground">
          {empty}
        </div>
      ) : (
        <div className="grid gap-3 sm:gap-4">
          {events.map((event, index) => (
            <Link
              key={event.id}
              to={`/events/${event.slug}`}
              className="group block rounded-2xl border bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md sm:p-5"
              style={{ animationDelay: `${index * 40}ms` }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-base font-semibold leading-snug text-foreground group-hover:text-primary sm:text-lg">
                    {event.title}
                  </h3>
                  <div className="mt-3 flex flex-col gap-1.5 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:gap-x-4">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 shrink-0 text-primary/70" />
                      <span className="break-words">{event.dateLabel}</span>
                    </span>
                    {event.location ? (
                      <span className="inline-flex items-start gap-1.5">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary/70" />
                        <span className="break-words">{event.location}</span>
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-[11px] font-medium",
                      past ? "bg-muted text-muted-foreground" : "bg-sky-soft text-primary",
                    )}
                  >
                    {past ? "Past" : "Open"}
                  </span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

import {
  ArrowRight,
  Award,
  Calendar,
  CalendarDays,
  MapPin,
  Search,
  UserRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PublicShell } from "@/components/PublicHeader";
import { api } from "@/lib/api";
import type { EventItem } from "@/lib/types";
import { cn } from "@/lib/utils";

const FEATURES = [
  {
    icon: CalendarDays,
    title: "No Account Needed",
    description: "Register in seconds with just your name and contact details.",
  },
  {
    icon: UserRound,
    title: "Track Attendance",
    description: "Look up your registration and attendance status anytime.",
  },
  {
    icon: Award,
    title: "Get Certificates",
    description: "Download your certificate of attendance after the event.",
  },
] as const;

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
    <PublicShell animate={false} className="bg-white">
      <section className="relative overflow-hidden border-b border-border/70">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#e8f0fb_0%,_#f7f9fc_45%,_#ffffff_100%)]" />
        <div className="pointer-events-none absolute -left-24 top-10 h-64 w-64 rounded-full bg-sky-soft/60 blur-3xl hero-glow" />
        <div className="pointer-events-none absolute -right-16 bottom-0 h-72 w-72 rounded-full bg-accent/50 blur-3xl hero-orb" />

        <div className="relative w-full max-w-5xl px-4 pb-14 pt-12 sm:px-6 sm:pb-20 sm:pt-16 lg:px-8">
          <div className="animate-fade-up inline-flex items-center rounded-full border border-border/80 bg-white/80 px-3.5 py-1 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur sm:text-sm">
            AiTLE · Event Registration Platform
          </div>

          <h1
            className="animate-fade-up-delay mt-6 max-w-3xl text-4xl font-bold leading-[1.15] tracking-tight sm:text-5xl lg:text-[3.25rem]"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            Register for Events.
            <span className="mt-1 block text-primary">Track Your Journey.</span>
          </h1>

          <p className="animate-fade-up-delay-2 mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Event registration and certificates for the Association of I.T. Leaders in Education
            （資訊科技教育領袖協會）. No account needed — register in seconds.
          </p>

          <div className="animate-fade-up-delay-3 mt-8 flex flex-wrap gap-3">
            <a
              href="#upcoming"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-md"
            >
              Browse Events
              <ArrowRight className="h-4 w-4" />
            </a>
            <Link
              to="/attendance-lookup"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-5 py-2.5 text-sm font-semibold text-foreground shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:bg-muted hover:shadow-md"
            >
              <Search className="h-4 w-4" />
              Find My Certificate
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-border/70 bg-white">
        <div className="w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-3 sm:gap-6">
            {FEATURES.map((feature, index) => (
              <div
                key={feature.title}
                className="animate-fade-up flex gap-3 sm:flex-col sm:gap-3.5"
                style={{ animationDelay: `${0.28 + index * 0.1}s` }}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-soft text-primary">
                  <feature.icon className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-foreground sm:text-base">{feature.title}</h2>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="bg-[#f7f9fc]">
        <div className="w-full max-w-5xl space-y-12 px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
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

      <footer className="hidden border-t bg-white md:block">
        <div className="flex w-full items-center justify-between gap-4 px-4 py-6 sm:px-6 lg:px-8">
          <Link to="/" className="flex min-w-0 items-center gap-3">
            <img src="/aitle-logo.png" alt="AiTLE" className="h-8 w-auto shrink-0" />
            <div className="min-w-0">
              <div className="text-sm font-semibold leading-tight">AiTLE Events</div>
              <div className="truncate text-[11px] text-muted-foreground">資訊科技教育領袖協會</div>
            </div>
          </Link>
          <Link
            to="/attendance-lookup"
            className="shrink-0 text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            Attendance Lookup
          </Link>
        </div>
      </footer>
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
    <section id={id} className="scroll-mt-24">
      <h2 className="mb-5 text-xl font-semibold tracking-tight sm:text-2xl">{title}</h2>
      {loading ? (
        <div className="space-y-4">
          {[0, 1].map((i) => (
            <div key={i} className="h-36 animate-pulse rounded-2xl bg-white/80" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-white/70 px-5 py-10 text-center text-sm text-muted-foreground">
          {empty}
        </div>
      ) : (
        <div className="grid gap-4">
          {events.map((event, index) => (
            <Link
              key={event.id}
              to={`/events/${event.slug}`}
              className="animate-fade-up group block overflow-hidden rounded-2xl border border-border/80 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-primary/20 hover:shadow-lg"
              style={{ animationDelay: `${0.08 + index * 0.06}s` }}
            >
              <div
                className={cn(
                  "h-1 w-full",
                  past ? "bg-border" : "bg-primary",
                )}
              />
              <div className="p-5 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg font-semibold leading-snug text-foreground transition-colors group-hover:text-primary sm:text-xl">
                    {event.title}
                  </h3>
                  {past ? (
                    <span className="shrink-0 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                      Past
                    </span>
                  ) : null}
                </div>

                {event.description ? (
                  <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                    {event.description}
                  </p>
                ) : null}

                <div className="mt-4 flex flex-col gap-1.5 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:gap-x-5">
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

                <div className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                  {past ? "View Details" : "Register Now"}
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

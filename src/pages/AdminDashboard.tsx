import { CalendarDays, LineChart, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import type { EventItem } from "@/lib/types";

interface Stats {
  totalEvents: number;
  totalRegistrations: number;
  attendanceRate: number;
  recent: EventItem[];
}

export function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    api.get<Stats>("/api/admin/stats").then(setStats);
  }, []);

  if (!stats) return <div className="text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Dashboard</h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          Overview of your events and registrations
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <StatCard label="Total Events" value={stats.totalEvents} icon={CalendarDays} />
        <StatCard label="Total Registrations" value={stats.totalRegistrations} icon={Users} />
        <StatCard label="Attendance Rate" value={`${stats.attendanceRate}%`} icon={LineChart} />
      </div>

      <section className="rounded-2xl border bg-white p-4 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold">Recent Events</h2>
        <div className="mt-3 space-y-2">
          {stats.recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No events yet. Create your first event to get started.
            </p>
          ) : (
            stats.recent.map((event) => (
              <Link
                key={event.id}
                to={`/admin/events/${event.id}`}
                className="flex items-start justify-between gap-3 rounded-xl px-2 py-3 transition hover:bg-muted/70 sm:items-center"
              >
                <div className="min-w-0">
                  <div className="font-medium leading-snug">{event.title}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{event.dateLabel}</div>
                </div>
                <div className="flex shrink-0 items-center gap-1 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  {event.registrationCount ?? 0}
                </div>
              </Link>
            ))
          )}
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-4 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold">Quick Actions</h2>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <Button className="h-11" asChild>
            <Link to="/admin/events/create">
              <CalendarDays className="h-4 w-4" />
              Create Event
            </Link>
          </Button>
          <Button variant="outline" className="h-11" asChild>
            <Link to="/admin/events">Manage Events</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: typeof Users;
}) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
        </div>
        <div className="rounded-xl bg-sky-soft p-2 text-primary">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

import { Award, Check, ExternalLink, Pencil } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import type { EventItem, Registration } from "@/lib/types";

interface Detail {
  event: EventItem;
  stats: { registered: number; attended: number; certified: number };
  registrations: Registration[];
}

export function AdminEventDetail() {
  const { id } = useParams();
  const [data, setData] = useState<Detail | null>(null);
  const [missing, setMissing] = useState(false);

  function load() {
    if (!id) return;
    api
      .get<Detail>(`/api/admin/events/${id}`)
      .then(setData)
      .catch(() => setMissing(true));
  }

  useEffect(() => {
    load();
  }, [id]);

  async function toggle(reg: Registration) {
    await api.patch(`/api/admin/registrations/${reg.id}/attendance`, {
      attended: !reg.attended,
    });
    load();
  }

  if (missing) {
    return (
      <div>
        <p>Event not found.</p>
        <Link to="/admin/events" className="text-sm text-primary">
          Back to Events
        </Link>
      </div>
    );
  }

  if (!data) return <div className="text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{data.event.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">{data.event.dateLabel}</p>
          <p className="text-sm text-muted-foreground">{data.event.location}</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" className="h-10" asChild>
            <a href={`/events/${data.event.slug}`} target="_blank" rel="noreferrer">
              <ExternalLink className="h-4 w-4" />
              Public page
            </a>
          </Button>
          <Button variant="outline" className="h-10" asChild>
            <Link to={`/admin/events/${data.event.id}/edit`}>
              <Pencil className="h-4 w-4" />
              Edit
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {[
          ["Registered", data.stats.registered],
          ["Attended", data.stats.attended],
          ["Certified", data.stats.certified],
        ].map(([label, value]) => (
          <div key={label as string} className="rounded-2xl border bg-white p-3 shadow-sm sm:p-5">
            <p className="text-[11px] text-muted-foreground sm:text-sm">{label}</p>
            <p className="mt-1 text-xl font-bold sm:text-2xl">{value}</p>
          </div>
        ))}
      </div>

      <section className="rounded-2xl border bg-white shadow-sm">
        <div className="border-b px-4 py-4 sm:px-6">
          <h2 className="text-lg font-semibold">Registrations</h2>
        </div>
        {data.registrations.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">
            No registrations yet. Share the public event page to start receiving registrations.
          </p>
        ) : (
          <div className="divide-y">
            {data.registrations.map((reg) => (
              <div key={reg.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div className="min-w-0">
                  <div className="font-medium">{reg.name}</div>
                  <div className="text-xs font-mono text-muted-foreground">#{reg.registrationId}</div>
                  <div className="mt-1 text-sm text-muted-foreground break-all">
                    {reg.email}
                    <br />
                    {reg.phone}
                  </div>
                  <div className="mt-2">
                    {reg.attended ? (
                      <Badge variant="success">Certified</Badge>
                    ) : (
                      <Badge variant="outline">Pending</Badge>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    size="sm"
                    className="h-10"
                    variant={reg.attended ? "outline" : "default"}
                    onClick={() => toggle(reg)}
                  >
                    <Check className="h-4 w-4" />
                    {reg.attended ? "Undo attend" : "Mark attended"}
                  </Button>
                  {reg.attended ? (
                    <Button size="sm" variant="outline" className="h-10" asChild>
                      <a href={`/certificate/${reg.registrationId}`} target="_blank" rel="noreferrer">
                        <Award className="h-4 w-4" />
                        Certificate
                      </a>
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

import { ExternalLink, Pencil, Share2, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PromoteDialog } from "@/components/PromoteDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import type { EventItem } from "@/lib/types";

export function AdminEvents() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [share, setShare] = useState<EventItem | null>(null);

  function load() {
    api.get<{ events: EventItem[] }>("/api/admin/events").then((d) => setEvents(d.events));
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(event: EventItem) {
    if (
      !confirm(
        `Delete Event\n\nThis will permanently delete "${event.title}" and all associated registrations. This action cannot be undone.`,
      )
    ) {
      return;
    }
    await api.delete(`/api/admin/events/${event.id}`);
    load();
  }

  return (
    <div className="stagger-children space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Events</h1>
          <p className="text-sm text-muted-foreground">Manage all your events</p>
        </div>
        <Button className="h-11 w-full transition duration-200 hover:-translate-y-0.5 sm:w-auto" asChild>
          <Link to="/admin/events/create">+ Create Event</Link>
        </Button>
      </div>

      {events.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-white px-5 py-12 text-center text-sm text-muted-foreground">
          No events yet. Create your first event to get started.
        </div>
      ) : (
        <>
          <div className="space-y-3 lg:hidden">
            {events.map((event) => (
              <div key={event.id} className="motion-card rounded-2xl border bg-white p-4 shadow-sm">
                <Link to={`/admin/events/${event.id}`} className="block font-semibold leading-snug">
                  {event.title}
                </Link>
                <p className="mt-2 text-sm text-muted-foreground">{event.dateLabel}</p>
                {event.location ? (
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{event.location}</p>
                ) : null}
                <div className="mt-3 flex items-center justify-between gap-2">
                  {event.published ? <Badge>Published</Badge> : <Badge variant="outline">Draft</Badge>}
                  <div className="flex items-center gap-1">
                    <a href={`/events/${event.slug}`} target="_blank" rel="noreferrer">
                      <Button variant="ghost" size="icon">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </a>
                    <Button variant="ghost" size="icon" asChild>
                      <Link to={`/admin/events/${event.id}/edit`}>
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setShare(event)}>
                      <Share2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => remove(event)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="motion-card hidden overflow-x-auto rounded-2xl border bg-white shadow-sm lg:block">
            <table className="w-full table-fixed text-sm">
              <thead className="border-b text-left text-muted-foreground">
                <tr>
                  <th className="w-[36%] px-4 py-3 font-medium">Event</th>
                  <th className="w-[20%] px-4 py-3 font-medium">Date</th>
                  <th className="w-[18%] px-4 py-3 font-medium">Location</th>
                  <th className="w-[10%] px-4 py-3 font-medium">Status</th>
                  <th className="w-[16%] px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id} className="border-b last:border-0 transition-colors hover:bg-muted/40">
                    <td className="px-4 py-3 align-top">
                      <Link
                        to={`/admin/events/${event.id}`}
                        className="line-clamp-2 font-medium leading-snug hover:underline"
                        title={event.title}
                      >
                        {event.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 align-top text-muted-foreground">
                      {event.dateLabel}
                    </td>
                    <td className="truncate px-4 py-3 align-top text-muted-foreground" title={event.location || undefined}>
                      {event.location || "—"}
                    </td>
                    <td className="px-4 py-3 align-top">
                      {event.published ? <Badge>Published</Badge> : <Badge variant="outline">Draft</Badge>}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex items-center gap-1">
                        <a href={`/events/${event.slug}`} target="_blank" rel="noreferrer">
                          <Button variant="ghost" size="icon">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </a>
                        <Button variant="ghost" size="icon" asChild>
                          <Link to={`/admin/events/${event.id}/edit`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setShare(event)}>
                          <Share2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => remove(event)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      {share ? <PromoteDialog event={share} onClose={() => setShare(null)} /> : null}
    </div>
  );
}

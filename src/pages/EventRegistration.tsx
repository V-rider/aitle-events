import { Calendar, CheckCircle2, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { PublicShell } from "@/components/PublicHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import type { EventField, EventItem } from "@/lib/types";

export function EventRegistration() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<EventItem | null>(null);
  const [fields, setFields] = useState<EventField[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ registrationId: string; name: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [answers, setAnswers] = useState<Record<string, string | boolean>>({});

  useEffect(() => {
    if (!slug) return;
    api
      .get<{ event: EventItem; fields: EventField[] }>(`/api/events/${slug}`)
      .then((d) => {
        setEvent(d.event);
        setFields(d.fields);
      })
      .catch(() => setError("not_found"));
  }, [slug]);

  if (error === "not_found") {
    return (
      <PublicShell animate={false}>
        <div className="container mx-auto max-w-xl px-4 py-20 text-center">
          <h1 className="animate-fade-up text-2xl font-semibold">Event not found</h1>
          <Link to="/" className="animate-fade-up-delay mt-3 inline-block text-sm text-primary">
            Back to Events
          </Link>
        </div>
      </PublicShell>
    );
  }

  if (!event) {
    return (
      <PublicShell>
        <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
          Loading…
        </div>
      </PublicShell>
    );
  }

  const passed = new Date(event.endAt || event.startAt).getTime() < Date.now();

  if (done) {
    return (
      <PublicShell animate={false}>
        <div className="container mx-auto max-w-xl px-4 py-14 text-center sm:py-20">
          <div className="animate-fade-up mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
            <CheckCircle2 className="h-9 w-9 text-emerald-600" />
          </div>
          <h1 className="animate-fade-up-delay text-2xl font-semibold sm:text-3xl">
            Registration confirmed
          </h1>
          <p className="animate-fade-up-delay-2 mt-3 text-muted-foreground">
            Thanks, {done.name}. Your registration ID is{" "}
            <span className="font-mono font-medium text-foreground">#{done.registrationId}</span>
          </p>
          <div className="animate-fade-up-delay-3 mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button
              className="h-11 transition duration-200 hover:-translate-y-0.5"
              onClick={() => navigate("/attendance-lookup")}
            >
              Check My Attendance
            </Button>
            <Button
              variant="outline"
              className="h-11 transition duration-200 hover:-translate-y-0.5"
              onClick={() => navigate("/")}
            >
              Browse More Events
            </Button>
          </div>
        </div>
      </PublicShell>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await api.post<{ registration: { registrationId: string; name: string } }>(
        `/api/events/${slug}/register`,
        { ...form, answers },
      );
      setDone(res.registration);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PublicShell animate={false}>
      <div className="border-b bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 text-white">
        <div className="container mx-auto max-w-2xl px-4 py-8 sm:py-12">
          <Link
            to="/"
            className="animate-fade-up text-sm text-white/70 transition-colors hover:text-white"
          >
            ← All events
          </Link>
          <h1
            className="animate-fade-up-delay mt-4 text-2xl font-bold leading-tight tracking-tight sm:text-4xl"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            {event.title}
          </h1>
          <div className="animate-fade-up-delay-2 mt-4 flex flex-col gap-2 text-sm text-white/75 sm:flex-row sm:flex-wrap sm:gap-x-5">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-4 w-4 shrink-0" />
              {event.dateLabel}
            </span>
            {event.location ? (
              <span className="inline-flex items-start gap-1.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{event.location}</span>
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-2xl px-4 py-6 sm:py-10">
        {event.description ? (
          <p className="animate-fade-up-delay-2 mb-6 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground sm:text-base">
            {event.description}
          </p>
        ) : null}

        {passed ? (
          <div className="animate-fade-up-delay-3 motion-card rounded-2xl border bg-white p-5 shadow-sm sm:p-6">
            <h2 className="font-semibold">This event has already passed</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Registration is no longer available.
            </p>
            <Link to="/attendance-lookup" className="mt-4 inline-block text-sm text-primary">
              Check your attendance history
            </Link>
          </div>
        ) : (
          <div className="animate-fade-up-delay-3 motion-card rounded-2xl border bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-semibold">Register</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              No account required. Fill in your details below.
            </p>
            <form className="mt-6 space-y-4" onSubmit={submit}>
              <div className="space-y-1.5">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  required
                  className="h-11"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  className="h-11"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  required
                  className="h-11"
                  placeholder="+852..."
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              {fields.map((field) => (
                <div key={field.id} className="space-y-1.5">
                  {field.type === "checkbox" ? (
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={Boolean(answers[field.id!])}
                        onChange={(e) =>
                          setAnswers({ ...answers, [field.id!]: e.target.checked })
                        }
                      />
                      {field.label}
                      {field.required ? " *" : ""}
                    </label>
                  ) : (
                    <>
                      <Label>
                        {field.label}
                        {field.required ? " *" : ""}
                      </Label>
                      <Input
                        required={field.required}
                        className="h-11"
                        value={String(answers[field.id!] ?? "")}
                        onChange={(e) =>
                          setAnswers({ ...answers, [field.id!]: e.target.value })
                        }
                      />
                    </>
                  )}
                </div>
              ))}
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              <Button
                type="submit"
                disabled={submitting}
                className="h-11 w-full transition duration-200 hover:-translate-y-0.5"
              >
                {submitting ? "Submitting…" : "Register"}
              </Button>
            </form>
          </div>
        )}
      </div>
    </PublicShell>
  );
}

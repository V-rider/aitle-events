import { GripVertical, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import type { EventField, EventItem } from "@/lib/types";
import { fromDatetimeLocal, toDatetimeLocal } from "@/lib/utils";

interface FormState {
  title: string;
  description: string;
  startAt: string;
  endAt: string;
  location: string;
  capacity: string;
  published: boolean;
  fields: EventField[];
}

const empty: FormState = {
  title: "",
  description: "",
  startAt: "",
  endAt: "",
  location: "",
  capacity: "",
  published: false,
  fields: [],
};

export function AdminEventForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [form, setForm] = useState<FormState>(empty);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.get<{ event: EventItem; fields: EventField[] }>(`/api/admin/events/${id}`).then((d) => {
      setForm({
        title: d.event.title,
        description: d.event.description,
        startAt: toDatetimeLocal(d.event.startAt),
        endAt: toDatetimeLocal(d.event.endAt),
        location: d.event.location,
        capacity: d.event.capacity?.toString() ?? "",
        published: d.event.published,
        fields: d.fields,
      });
    });
  }, [id]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const payload = {
      title: form.title,
      description: form.description,
      startAt: fromDatetimeLocal(form.startAt),
      endAt: fromDatetimeLocal(form.endAt),
      location: form.location,
      capacity: form.capacity ? Number(form.capacity) : null,
      published: form.published,
      fields: form.fields,
    };
    try {
      if (isEdit) {
        await api.put(`/api/admin/events/${id}`, payload);
        navigate(`/admin/events/${id}`);
      } else {
        const res = await api.post<{ event: { id: string } }>("/api/admin/events", payload);
        navigate(`/admin/events/${res.event.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="space-y-6 pb-8" onSubmit={submit}>
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {isEdit ? "Edit Event" : "Create Event"}
        </h1>
        <p className="text-sm text-muted-foreground">
          Set up a new event and its registration form
        </p>
      </div>
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle>Event Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              required
              placeholder="e.g. Annual Tech Conference 2025"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the event, agenda, speakers..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="start">Start Date & Time *</Label>
              <Input
                id="start"
                type="datetime-local"
                required
                value={form.startAt}
                onChange={(e) => setForm({ ...form, startAt: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="end">End Date & Time</Label>
              <Input
                id="end"
                type="datetime-local"
                value={form.endAt}
                onChange={(e) => setForm({ ...form, endAt: e.target.value })}
              />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="capacity">Capacity (optional)</Label>
              <Input
                id="capacity"
                type="number"
                min={1}
                placeholder="Unlimited"
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="e.g. Convention Center, Hall A"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </div>
          </div>
          <label className="flex items-center justify-between gap-4 rounded-md border p-3">
            <span className="text-sm">Published (visible to public)</span>
            <Switch
              checked={form.published}
              onCheckedChange={(published) => setForm({ ...form, published })}
            />
          </label>
        </CardContent>
      </Card>

      <Card className="rounded-2xl shadow-sm">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Registration Form Fields</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Name, Email, and Phone are always included. Add custom fields below.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
            onClick={() =>
              setForm({
                ...form,
                fields: [...form.fields, { label: "New field", type: "text", required: false }],
              })
            }
          >
            <Plus className="h-4 w-4" />
            Add Field
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {["Full Name", "Email Address", "Phone Number"].map((label) => (
            <div key={label} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm bg-muted/40">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
              <span className="flex-1">{label}</span>
              <span className="text-xs text-muted-foreground">Built-in</span>
            </div>
          ))}
          {form.fields.length === 0 ? (
            <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
              No custom fields yet. Click 'Add Field' to create custom form fields.
            </div>
          ) : (
            form.fields.map((field, index) => (
              <div
                key={index}
                className="grid items-center gap-2 rounded-xl border p-2 sm:grid-cols-[1fr_140px_auto_auto]"
              >
                <Input
                  value={field.label}
                  onChange={(e) => {
                    const fields = [...form.fields];
                    fields[index] = { ...field, label: e.target.value };
                    setForm({ ...form, fields });
                  }}
                />
                <select
                  className="h-10 rounded-md border px-2 text-sm"
                  value={field.type}
                  onChange={(e) => {
                    const fields = [...form.fields];
                    fields[index] = { ...field, type: e.target.value as EventField["type"] };
                    setForm({ ...form, fields });
                  }}
                >
                  <option value="text">Text Input</option>
                  <option value="checkbox">Checkbox</option>
                </select>
                <label className="flex items-center gap-1 text-xs">
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={(e) => {
                      const fields = [...form.fields];
                      fields[index] = { ...field, required: e.target.checked };
                      setForm({ ...form, fields });
                    }}
                  />
                  Required
                </label>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    setForm({ ...form, fields: form.fields.filter((_, i) => i !== index) })
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <div className="flex flex-col-reverse gap-3 sm:flex-row">
        <Button type="submit" className="h-11" disabled={saving}>
          {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Event"}
        </Button>
        <Button type="button" variant="outline" className="h-11" asChild>
          <Link to="/admin/events">Cancel</Link>
        </Button>
      </div>
    </form>
  );
}

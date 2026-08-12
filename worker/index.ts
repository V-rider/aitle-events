import { Hono } from "hono";
import type {
  AdminInviteRow,
  AdminRow,
  CertificateTemplate,
  Env,
  EventFieldRow,
  EventRow,
  RegistrationRow,
} from "./types";
import {
  DEFAULT_CERTIFICATE_TEMPLATE,
  DEFAULT_MESSAGE_TEMPLATE,
} from "./types";
import { ensureSchema } from "./schema";
import {
  applyTemplate,
  formatEventRange,
  json,
  normalizeEmail,
  normalizePhone,
  shortId,
  slugify,
} from "./util";
import {
  clearSessionCookie,
  currentUser,
  exchangeGoogleCode,
  googleAuthUrl,
  requireAdmin,
  setSessionCookie,
  signSession,
  upsertAdminFromLogin,
} from "./auth";
import {
  getSetting,
  notificationStatus,
  sendEmail,
  sendRegistrationNotifications,
  sendWhatsApp,
} from "./notify";

const app = new Hono<{ Bindings: Env }>();

app.use("/api/*", async (c, next) => {
  await ensureSchema(c.env);
  await next();
});

function parseTemplate(raw: string | null): CertificateTemplate {
  if (!raw) return DEFAULT_CERTIFICATE_TEMPLATE;
  try {
    return { ...DEFAULT_CERTIFICATE_TEMPLATE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_CERTIFICATE_TEMPLATE;
  }
}

function publicEvent(row: EventRow, extra?: Record<string, unknown>) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    startAt: row.start_at,
    endAt: row.end_at,
    location: row.location,
    capacity: row.capacity,
    published: Boolean(row.published),
    createdAt: row.created_at,
    dateLabel: formatEventRange(row.start_at, row.end_at),
    ...extra,
  };
}

async function fieldsFor(env: Env, eventId: string) {
  const { results } = await env.DB.prepare(
    "SELECT * FROM event_fields WHERE event_id = ? ORDER BY sort_order ASC",
  )
    .bind(eventId)
    .all<EventFieldRow>();
  return results.map((f) => ({
    id: f.id,
    label: f.label,
    type: f.type,
    required: Boolean(f.required),
    sortOrder: f.sort_order,
  }));
}

async function uniqueSlug(env: Env, title: string, excludeId?: string) {
  const base = slugify(title);
  let slug = base;
  let n = 2;
  for (;;) {
    const row = await env.DB.prepare("SELECT id FROM events WHERE slug = ?")
      .bind(slug)
      .first<EventRow>();
    if (!row || row.id === excludeId) return slug;
    slug = `${base}-${n++}`;
  }
}

async function registrationCount(env: Env, eventId: string) {
  const row = await env.DB.prepare(
    "SELECT COUNT(*) AS n FROM registrations WHERE event_id = ?",
  )
    .bind(eventId)
    .first<{ n: number }>();
  return row?.n ?? 0;
}

// ---- public ----

app.get("/api/events", async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM events WHERE published = 1 ORDER BY start_at ASC",
  ).all<EventRow>();
  const items = await Promise.all(
    results.map(async (row) =>
      publicEvent(row, { registrationCount: await registrationCount(c.env, row.id) }),
    ),
  );
  return json({ events: items });
});

app.get("/api/events/:slug", async (c) => {
  const row = await c.env.DB.prepare(
    "SELECT * FROM events WHERE slug = ? AND published = 1",
  )
    .bind(c.req.param("slug"))
    .first<EventRow>();
  if (!row) return json({ error: "Event not found" }, 404);
  const count = await registrationCount(c.env, row.id);
  return json({
    event: publicEvent(row, {
      registrationCount: count,
      remaining:
        row.capacity == null ? null : Math.max(0, row.capacity - count),
    }),
    fields: await fieldsFor(c.env, row.id),
  });
});

app.post("/api/events/:slug/register", async (c) => {
  const row = await c.env.DB.prepare(
    "SELECT * FROM events WHERE slug = ? AND published = 1",
  )
    .bind(c.req.param("slug"))
    .first<EventRow>();
  if (!row) return json({ error: "Event not found" }, 404);
  if (new Date(row.end_at || row.start_at).getTime() < Date.now()) {
    return json({ error: "This event has already passed" }, 400);
  }

  const body = await c.req.json<{
    name?: string;
    email?: string;
    phone?: string;
    answers?: Record<string, string | boolean>;
  }>();
  const name = (body.name || "").trim();
  const email = normalizeEmail(body.email || "");
  const phone = normalizePhone(body.phone || "");
  if (!name || !email || !phone) {
    return json({ error: "Name, email, and phone are required" }, 400);
  }

  const fields = await fieldsFor(c.env, row.id);
  const answers: Record<string, string | boolean> = {};
  for (const field of fields) {
    const value = body.answers?.[field.id];
    if (field.required) {
      if (field.type === "checkbox" && value !== true) {
        return json({ error: `${field.label} is required` }, 400);
      }
      if (field.type === "text" && !String(value || "").trim()) {
        return json({ error: `${field.label} is required` }, 400);
      }
    }
    if (value !== undefined) answers[field.id] = value;
  }

  const count = await registrationCount(c.env, row.id);
  if (row.capacity != null && count >= row.capacity) {
    return json({ error: "This event is full" }, 400);
  }

  const dup = await c.env.DB.prepare(
    "SELECT id FROM registrations WHERE event_id = ? AND (email = ? OR phone = ?)",
  )
    .bind(row.id, email, phone)
    .first();
  if (dup) {
    return json({ error: "You are already registered for this event" }, 409);
  }

  const id = crypto.randomUUID();
  const registrationId = shortId();
  const now = new Date().toISOString();
  await c.env.DB.prepare(
    `INSERT INTO registrations (id, registration_id, event_id, name, email, phone, answers, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(id, registrationId, row.id, name, email, phone, JSON.stringify(answers), now)
    .run();

  const vars = {
    name,
    event: row.title,
    date: formatEventRange(row.start_at, row.end_at),
    location: row.location || "-",
    registrationId,
  };
  c.executionCtx.waitUntil(
    sendRegistrationNotifications(c.env, { email, phone }, vars),
  );

  return json({
    registration: {
      id,
      registrationId,
      name,
      email,
      phone,
      eventTitle: row.title,
      dateLabel: vars.date,
      location: row.location,
    },
  });
});

app.get("/api/attendance", async (c) => {
  const q = (c.req.query("q") || "").trim();
  if (!q) return json({ records: [] });
  const email = normalizeEmail(q);
  const phone = normalizePhone(q);
  const { results } = await c.env.DB.prepare(
    `SELECT r.*, e.title AS event_title, e.start_at, e.end_at, e.location, e.slug
     FROM registrations r
     JOIN events e ON e.id = r.event_id
     WHERE r.email = ? OR r.phone = ?
     ORDER BY e.start_at DESC`,
  )
    .bind(email, phone)
    .all<
      RegistrationRow & {
        event_title: string;
        start_at: string;
        end_at: string | null;
        location: string;
        slug: string;
      }
    >();

  return json({
    records: results.map((r) => ({
      registrationId: r.registration_id,
      name: r.name,
      email: r.email,
      phone: r.phone,
      eventTitle: r.event_title,
      slug: r.slug,
      location: r.location,
      dateLabel: formatEventRange(r.start_at, r.end_at),
      attended: Boolean(r.attended_at),
      createdAt: r.created_at,
    })),
  });
});

app.get("/api/certificates/:id", async (c) => {
  const id = c.req.param("id").replace(/^#/, "");
  const row = await c.env.DB.prepare(
    `SELECT r.*, e.title AS event_title, e.start_at, e.end_at, e.location
     FROM registrations r
     JOIN events e ON e.id = r.event_id
     WHERE r.registration_id = ? OR r.id = ?`,
  )
    .bind(id, id)
    .first<
      RegistrationRow & {
        event_title: string;
        start_at: string;
        end_at: string | null;
        location: string;
      }
    >();
  if (!row) return json({ error: "not_found" }, 404);
  const template = parseTemplate(
    await getSetting(c.env, "certificate_template", ""),
  );
  const payload = {
    registrationId: row.registration_id,
    name: row.name,
    eventTitle: row.event_title,
    location: row.location,
    dateLabel: formatEventRange(row.start_at, row.end_at),
    attended: Boolean(row.attended_at),
    template,
  };
  if (!row.attended_at) return json({ error: "not_available", ...payload }, 403);
  return json(payload);
});

// ---- auth ----

app.get("/api/auth/me", async (c) => {
  const user = await currentUser(c);
  if (!user) {
    return c.json({
      user: null,
      admin: false,
      googleConfigured: notificationStatus(c.env).googleConfigured,
    });
  }
  const admin = await c.env.DB.prepare("SELECT * FROM admins WHERE email = ?")
    .bind(normalizeEmail(user.email))
    .first<AdminRow>();
  return c.json({
    user,
    admin: Boolean(admin),
    googleConfigured: notificationStatus(c.env).googleConfigured,
  });
});

app.get("/api/auth/google", (c) => {
  const url = googleAuthUrl(c.env, c.req.raw);
  if (!url) return json({ error: "Google OAuth is not configured" }, 400);
  return c.redirect(url);
});

app.get("/api/auth/callback", async (c) => {
  const code = c.req.query("code");
  if (!code) return c.redirect("/admin?error=missing_code");
  try {
    const profile = await exchangeGoogleCode(c.env, c.req.raw, code);
    const result = await upsertAdminFromLogin(c.env, profile, profile.sub);
    if (!result.ok) {
      return c.redirect(`/admin?error=${encodeURIComponent(result.reason)}`);
    }
    const token = await signSession(c.env, profile);
    setSessionCookie(c, token);
    return c.redirect("/admin/dashboard");
  } catch (err) {
    console.error(err);
    return c.redirect("/admin?error=oauth_failed");
  }
});

app.post("/api/auth/dev-login", async (c) => {
  if (c.env.GOOGLE_CLIENT_ID) {
    return json({ error: "Use Google sign-in" }, 400);
  }
  const body = await c.req.json<{ email?: string; name?: string }>();
  const email = normalizeEmail(body.email || "");
  if (!email) return json({ error: "Email is required" }, 400);
  const user = { email, name: body.name?.trim() || email };
  const result = await upsertAdminFromLogin(c.env, user);
  if (!result.ok) return json({ error: result.reason }, 403);
  const token = await signSession(c.env, user);
  setSessionCookie(c, token);
  return c.json({ ok: true, user });
});

app.post("/api/auth/logout", (c) => {
  clearSessionCookie(c);
  return c.json({ ok: true });
});

// ---- admin ----

app.get("/api/admin/stats", async (c) => {
  const gate = await requireAdmin(c);
  if (gate.error) return gate.error;
  const events = await c.env.DB.prepare(
    "SELECT COUNT(*) AS n FROM events",
  ).first<{ n: number }>();
  const regs = await c.env.DB.prepare(
    "SELECT COUNT(*) AS n FROM registrations",
  ).first<{ n: number }>();
  const attended = await c.env.DB.prepare(
    "SELECT COUNT(*) AS n FROM registrations WHERE attended_at IS NOT NULL",
  ).first<{ n: number }>();
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM events ORDER BY start_at DESC LIMIT 8",
  ).all<EventRow>();
  const recent = await Promise.all(
    results.map(async (row) =>
      publicEvent(row, { registrationCount: await registrationCount(c.env, row.id) }),
    ),
  );
  const totalRegs = regs?.n ?? 0;
  return json({
    totalEvents: events?.n ?? 0,
    totalRegistrations: totalRegs,
    attendanceRate: totalRegs === 0 ? 0 : Math.round(((attended?.n ?? 0) / totalRegs) * 100),
    recent,
  });
});

app.get("/api/admin/events", async (c) => {
  const gate = await requireAdmin(c);
  if (gate.error) return gate.error;
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM events ORDER BY start_at DESC",
  ).all<EventRow>();
  const events = await Promise.all(
    results.map(async (row) =>
      publicEvent(row, { registrationCount: await registrationCount(c.env, row.id) }),
    ),
  );
  return json({ events });
});

app.get("/api/admin/events/:id", async (c) => {
  const gate = await requireAdmin(c);
  if (gate.error) return gate.error;
  const row = await c.env.DB.prepare("SELECT * FROM events WHERE id = ?")
    .bind(c.req.param("id"))
    .first<EventRow>();
  if (!row) return json({ error: "Event not found" }, 404);
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM registrations WHERE event_id = ? ORDER BY created_at DESC",
  )
    .bind(row.id)
    .all<RegistrationRow>();
  const attended = results.filter((r) => r.attended_at).length;
  return json({
    event: publicEvent(row),
    fields: await fieldsFor(c.env, row.id),
    stats: {
      registered: results.length,
      attended,
      certified: attended,
    },
    registrations: results.map((r) => ({
      id: r.id,
      registrationId: r.registration_id,
      name: r.name,
      email: r.email,
      phone: r.phone,
      answers: JSON.parse(r.answers || "{}"),
      attended: Boolean(r.attended_at),
      createdAt: r.created_at,
    })),
  });
});

app.post("/api/admin/events", async (c) => {
  const gate = await requireAdmin(c);
  if (gate.error) return gate.error;
  const body = await c.req.json<{
    title?: string;
    description?: string;
    startAt?: string;
    endAt?: string | null;
    location?: string;
    capacity?: number | null;
    published?: boolean;
    fields?: { label: string; type: "text" | "checkbox"; required?: boolean }[];
  }>();
  if (!body.title?.trim() || !body.startAt) {
    return json({ error: "Title and start date are required" }, 400);
  }
  const id = crypto.randomUUID();
  const slug = await uniqueSlug(c.env, body.title);
  const now = new Date().toISOString();
  await c.env.DB.prepare(
    `INSERT INTO events (id, slug, title, description, start_at, end_at, location, capacity, published, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      id,
      slug,
      body.title.trim(),
      body.description?.trim() || "",
      body.startAt,
      body.endAt || null,
      body.location?.trim() || "",
      body.capacity ?? null,
      body.published ? 1 : 0,
      now,
    )
    .run();
  if (body.fields?.length) {
    const stmts = body.fields.map((f, i) =>
      c.env.DB.prepare(
        "INSERT INTO event_fields (id, event_id, label, type, required, sort_order) VALUES (?, ?, ?, ?, ?, ?)",
      ).bind(
        crypto.randomUUID(),
        id,
        f.label.trim(),
        f.type,
        f.required ? 1 : 0,
        i,
      ),
    );
    await c.env.DB.batch(stmts);
  }
  return json({ event: { id, slug } });
});

app.put("/api/admin/events/:id", async (c) => {
  const gate = await requireAdmin(c);
  if (gate.error) return gate.error;
  const id = c.req.param("id");
  const existing = await c.env.DB.prepare("SELECT * FROM events WHERE id = ?")
    .bind(id)
    .first<EventRow>();
  if (!existing) return json({ error: "Event not found" }, 404);
  const body = await c.req.json<{
    title?: string;
    description?: string;
    startAt?: string;
    endAt?: string | null;
    location?: string;
    capacity?: number | null;
    published?: boolean;
    fields?: { label: string; type: "text" | "checkbox"; required?: boolean }[];
  }>();
  const title = body.title?.trim() || existing.title;
  const slug =
    title === existing.title ? existing.slug : await uniqueSlug(c.env, title, id);
  await c.env.DB.prepare(
    `UPDATE events SET slug = ?, title = ?, description = ?, start_at = ?, end_at = ?, location = ?, capacity = ?, published = ?
     WHERE id = ?`,
  )
    .bind(
      slug,
      title,
      body.description ?? existing.description,
      body.startAt || existing.start_at,
      body.endAt === undefined ? existing.end_at : body.endAt,
      body.location ?? existing.location,
      body.capacity === undefined ? existing.capacity : body.capacity,
      body.published === undefined ? existing.published : body.published ? 1 : 0,
      id,
    )
    .run();
  if (body.fields) {
    await c.env.DB.prepare("DELETE FROM event_fields WHERE event_id = ?")
      .bind(id)
      .run();
    if (body.fields.length) {
      await c.env.DB.batch(
        body.fields.map((f, i) =>
          c.env.DB.prepare(
            "INSERT INTO event_fields (id, event_id, label, type, required, sort_order) VALUES (?, ?, ?, ?, ?, ?)",
          ).bind(
            crypto.randomUUID(),
            id,
            f.label.trim(),
            f.type,
            f.required ? 1 : 0,
            i,
          ),
        ),
      );
    }
  }
  return json({ ok: true, slug });
});

app.delete("/api/admin/events/:id", async (c) => {
  const gate = await requireAdmin(c);
  if (gate.error) return gate.error;
  const id = c.req.param("id");
  await c.env.DB.batch([
    c.env.DB.prepare("DELETE FROM registrations WHERE event_id = ?").bind(id),
    c.env.DB.prepare("DELETE FROM event_fields WHERE event_id = ?").bind(id),
    c.env.DB.prepare("DELETE FROM events WHERE id = ?").bind(id),
  ]);
  return json({ ok: true });
});

app.patch("/api/admin/registrations/:id/attendance", async (c) => {
  const gate = await requireAdmin(c);
  if (gate.error) return gate.error;
  const body = await c.req.json<{ attended?: boolean }>();
  const attendedAt = body.attended ? new Date().toISOString() : null;
  await c.env.DB.prepare(
    "UPDATE registrations SET attended_at = ? WHERE id = ?",
  )
    .bind(attendedAt, c.req.param("id"))
    .run();
  return json({ ok: true, attended: Boolean(attendedAt) });
});

app.get("/api/admin/users", async (c) => {
  const gate = await requireAdmin(c);
  if (gate.error) return gate.error;
  const { results: users } = await c.env.DB.prepare(
    "SELECT * FROM admins ORDER BY last_signed_in DESC",
  ).all<AdminRow>();
  const { results: invites } = await c.env.DB.prepare(
    "SELECT * FROM admin_invites ORDER BY created_at DESC",
  ).all<AdminInviteRow>();
  return json({
    users: users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      lastSignedIn: u.last_signed_in,
    })),
    invites: invites.map((i) => ({
      id: i.id,
      email: i.email,
      status: i.status,
      createdAt: i.created_at,
    })),
    me: gate.user.email,
  });
});

app.post("/api/admin/invites", async (c) => {
  const gate = await requireAdmin(c);
  if (gate.error) return gate.error;
  const body = await c.req.json<{ email?: string }>();
  const email = normalizeEmail(body.email || "");
  if (!email) return json({ error: "Email is required" }, 400);
  await c.env.DB.prepare(
    "INSERT OR IGNORE INTO admin_invites (id, email, status, created_at) VALUES (?, ?, 'pending', ?)",
  )
    .bind(crypto.randomUUID(), email, new Date().toISOString())
    .run();
  return json({ ok: true });
});

app.delete("/api/admin/invites/:id", async (c) => {
  const gate = await requireAdmin(c);
  if (gate.error) return gate.error;
  await c.env.DB.prepare("DELETE FROM admin_invites WHERE id = ?")
    .bind(c.req.param("id"))
    .run();
  return json({ ok: true });
});

app.delete("/api/admin/users/:id", async (c) => {
  const gate = await requireAdmin(c);
  if (gate.error) return gate.error;
  const target = await c.env.DB.prepare("SELECT * FROM admins WHERE id = ?")
    .bind(c.req.param("id"))
    .first<AdminRow>();
  if (!target) return json({ error: "User not found" }, 404);
  if (normalizeEmail(target.email) === normalizeEmail(gate.user.email)) {
    return json({ error: "You cannot remove yourself" }, 400);
  }
  await c.env.DB.prepare("DELETE FROM admins WHERE id = ?")
    .bind(target.id)
    .run();
  return json({ ok: true });
});

app.get("/api/admin/settings", async (c) => {
  const gate = await requireAdmin(c);
  if (gate.error) return gate.error;
  const emailEnabled = (await getSetting(c.env, "email_enabled", "1")) === "1";
  const whatsappEnabled = (await getSetting(c.env, "whatsapp_enabled", "0")) === "1";
  const messageTemplate = await getSetting(
    c.env,
    "message_template",
    DEFAULT_MESSAGE_TEMPLATE,
  );
  const certificateTemplate = parseTemplate(
    await getSetting(c.env, "certificate_template", ""),
  );
  return json({
    emailEnabled,
    whatsappEnabled,
    messageTemplate,
    certificateTemplate,
    defaults: {
      messageTemplate: DEFAULT_MESSAGE_TEMPLATE,
      certificateTemplate: DEFAULT_CERTIFICATE_TEMPLATE,
    },
    status: notificationStatus(c.env),
  });
});

app.put("/api/admin/settings", async (c) => {
  const gate = await requireAdmin(c);
  if (gate.error) return gate.error;
  const body = await c.req.json<{
    emailEnabled?: boolean;
    whatsappEnabled?: boolean;
    messageTemplate?: string;
    certificateTemplate?: Partial<CertificateTemplate>;
  }>();
  const stmts = [];
  if (body.emailEnabled !== undefined) {
    stmts.push(
      c.env.DB.prepare(
        "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
      ).bind("email_enabled", body.emailEnabled ? "1" : "0"),
    );
  }
  if (body.whatsappEnabled !== undefined) {
    stmts.push(
      c.env.DB.prepare(
        "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
      ).bind("whatsapp_enabled", body.whatsappEnabled ? "1" : "0"),
    );
  }
  if (body.messageTemplate !== undefined) {
    stmts.push(
      c.env.DB.prepare(
        "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
      ).bind("message_template", body.messageTemplate),
    );
  }
  if (body.certificateTemplate) {
    const current = parseTemplate(
      await getSetting(c.env, "certificate_template", ""),
    );
    const next = { ...current, ...body.certificateTemplate };
    stmts.push(
      c.env.DB.prepare(
        "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
      ).bind("certificate_template", JSON.stringify(next)),
    );
  }
  if (stmts.length) await c.env.DB.batch(stmts);
  return json({ ok: true });
});

app.post("/api/admin/settings/test", async (c) => {
  const gate = await requireAdmin(c);
  if (gate.error) return gate.error;
  const body = await c.req.json<{ channel?: "email" | "whatsapp"; to?: string }>();
  const to = (body.to || "").trim();
  if (!to) return json({ error: "Destination is required" }, 400);
  const template = await getSetting(
    c.env,
    "message_template",
    DEFAULT_MESSAGE_TEMPLATE,
  );
  const vars = {
    name: gate.user.name || "Admin",
    event: "Test Event",
    date: "August 12th, 2026 9:30 AM – 5:00 PM",
    location: "Ying Wa College",
    registrationId: "TEST1234",
  };
  const message = applyTemplate(template, vars);
  if (body.channel === "whatsapp") {
    const result = await sendWhatsApp(c.env, to, message, vars);
    return json(result, result.ok ? 200 : 400);
  }
  const result = await sendEmail(c.env, to, "AiTLE registration test", message);
  return json(result, result.ok ? 200 : 400);
});

app.all("/api/*", () => json({ error: "Not found" }, 404));

export default app;

import type { Env } from "./types";
import { applyTemplate, normalizePhone } from "./util";

export interface NotifyVars {
  name: string;
  event: string;
  date: string;
  location: string;
  registrationId: string;
}

export async function getSetting(
  env: Env,
  key: string,
  fallback = "",
): Promise<string> {
  const row = await env.DB.prepare("SELECT value FROM settings WHERE key = ?")
    .bind(key)
    .first<{ value: string }>();
  return row?.value ?? fallback;
}

export async function sendRegistrationNotifications(
  env: Env,
  to: { email: string; phone: string },
  vars: NotifyVars,
): Promise<void> {
  const template = await getSetting(
    env,
    "message_template",
    "Hi {{name}}! Your registration is confirmed. ID #{{registrationId}}.",
  );
  const message = applyTemplate(template, { ...vars });

  const emailOn = (await getSetting(env, "email_enabled", "1")) === "1";
  const waOn = (await getSetting(env, "whatsapp_enabled", "0")) === "1";

  if (emailOn && env.RESEND_API_KEY) {
    try {
      await sendEmail(env, to.email, `Registration confirmed: ${vars.event}`, message);
    } catch (err) {
      console.error("[email]", err);
    }
  }

  if (waOn && env.WHATSAPP_TOKEN && env.WHATSAPP_PHONE_NUMBER_ID && to.phone) {
    try {
      await sendWhatsApp(env, to.phone, message, vars);
    } catch (err) {
      console.error("[whatsapp]", err);
    }
  }
}

export async function sendEmail(
  env: Env,
  to: string,
  subject: string,
  text: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!env.RESEND_API_KEY) {
    return { ok: false, error: "RESEND_API_KEY is not configured" };
  }
  const from = env.RESEND_FROM || "AiTLE Events <noreply@resend.dev>";
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.RESEND_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ from, to: [to], subject, text }),
  });
  if (!res.ok) {
    const body = await res.text();
    return { ok: false, error: body || `Resend ${res.status}` };
  }
  return { ok: true };
}

export async function sendWhatsApp(
  env: Env,
  phone: string,
  text: string,
  vars?: NotifyVars,
): Promise<{ ok: boolean; error?: string }> {
  if (!env.WHATSAPP_TOKEN || !env.WHATSAPP_PHONE_NUMBER_ID) {
    return { ok: false, error: "WhatsApp Cloud API credentials are not configured" };
  }
  const to = normalizePhone(phone).replace(/^\+/, "");
  const templateName = env.WHATSAPP_TEMPLATE_NAME;
  const url = `https://graph.facebook.com/v21.0/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
  const payload = templateName && vars
    ? {
        messaging_product: "whatsapp",
        to,
        type: "template",
        template: {
          name: templateName,
          language: { code: "en" },
          components: [
            {
              type: "body",
              parameters: [
                { type: "text", text: vars.name },
                { type: "text", text: vars.event },
                { type: "text", text: vars.date },
                { type: "text", text: vars.location || "-" },
                { type: "text", text: vars.registrationId },
              ],
            },
          ],
        },
      }
    : {
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: text },
      };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.WHATSAPP_TOKEN}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.text();
    return { ok: false, error: body || `WhatsApp ${res.status}` };
  }
  return { ok: true };
}

export function notificationStatus(env: Env) {
  return {
    emailConfigured: Boolean(env.RESEND_API_KEY),
    whatsappConfigured: Boolean(
      env.WHATSAPP_TOKEN && env.WHATSAPP_PHONE_NUMBER_ID,
    ),
    googleConfigured: Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
  };
}

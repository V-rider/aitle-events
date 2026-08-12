export interface Env {
  DB: D1Database;
  SESSION_SECRET?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  APP_URL?: string;
  RESEND_API_KEY?: string;
  RESEND_FROM?: string;
  WHATSAPP_TOKEN?: string;
  WHATSAPP_PHONE_NUMBER_ID?: string;
  WHATSAPP_TEMPLATE_NAME?: string;
}

export type FieldType = "text" | "checkbox";

export interface EventRow {
  id: string;
  slug: string;
  title: string;
  description: string;
  start_at: string;
  end_at: string | null;
  location: string;
  capacity: number | null;
  published: number;
  created_at: string;
}

export interface EventFieldRow {
  id: string;
  event_id: string;
  label: string;
  type: FieldType;
  required: number;
  sort_order: number;
}

export interface RegistrationRow {
  id: string;
  registration_id: string;
  event_id: string;
  name: string;
  email: string;
  phone: string;
  answers: string;
  attended_at: string | null;
  created_at: string;
}

export interface AdminRow {
  id: string;
  email: string;
  name: string;
  role: string;
  last_signed_in: string | null;
  google_sub: string | null;
}

export interface AdminInviteRow {
  id: string;
  email: string;
  status: string;
  created_at: string;
}

export interface SessionUser {
  email: string;
  name: string;
  picture?: string;
}

export interface CertificateTemplate {
  heading: string;
  intro: string;
  body: string;
  issuer: string;
  footer: string;
  accentColor: string;
}

export const DEFAULT_MESSAGE_TEMPLATE =
  'Hi {{name}}! Your registration for "{{event}}" on {{date}}({{location}}) is confirmed. Your registration ID is #{{registrationId}}. See you there!';

export const DEFAULT_CERTIFICATE_TEMPLATE: CertificateTemplate = {
  heading: "Certificate of Attendance",
  intro: "This is to certify that",
  body: "has successfully attended",
  issuer:
    "Association of I.T. Leaders in Education / 資訊科技教育領袖協會",
  footer: "",
  accentColor: "#1d4ed8",
};

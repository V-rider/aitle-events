export interface EventField {
  id?: string;
  label: string;
  type: "text" | "checkbox";
  required: boolean;
  sortOrder?: number;
}

export interface EventItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  startAt: string;
  endAt: string | null;
  location: string;
  capacity: number | null;
  published: boolean;
  createdAt?: string;
  dateLabel: string;
  registrationCount?: number;
  remaining?: number | null;
}

export interface Registration {
  id: string;
  registrationId: string;
  name: string;
  email: string;
  phone: string;
  answers?: Record<string, string | boolean>;
  attended: boolean;
  createdAt: string;
}

export interface CertificateTemplate {
  heading: string;
  intro: string;
  body: string;
  issuer: string;
  footer: string;
  accentColor: string;
}

export interface CertificatePayload {
  registrationId: string;
  name: string;
  eventTitle: string;
  location: string;
  dateLabel: string;
  attended: boolean;
  template: CertificateTemplate;
}

export const DEFAULT_CERTIFICATE_TEMPLATE: CertificateTemplate = {
  heading: "Certificate of Attendance",
  intro: "This is to certify that",
  body: "has successfully attended",
  issuer:
    "Association of I.T. Leaders in Education / 資訊科技教育領袖協會",
  footer: "",
  accentColor: "#1d4ed8",
};

export const DEFAULT_MESSAGE_TEMPLATE =
  'Hi {{name}}! Your registration for "{{event}}" on {{date}}({{location}}) is confirmed. Your registration ID is #{{registrationId}}. See you there!';

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  CERTIFICATE_DESIGN_WIDTH,
  CertificateView,
} from "@/components/CertificateView";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import {
  DEFAULT_CERTIFICATE_TEMPLATE,
  DEFAULT_MESSAGE_TEMPLATE,
  type CertificateTemplate,
} from "@/lib/types";

interface Settings {
  emailEnabled: boolean;
  whatsappEnabled: boolean;
  messageTemplate: string;
  certificateTemplate: CertificateTemplate;
  defaults: {
    messageTemplate: string;
    certificateTemplate: CertificateTemplate;
  };
  status: {
    emailConfigured: boolean;
    whatsappConfigured: boolean;
    googleConfigured: boolean;
  };
}

export function AdminSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [testEmail, setTestEmail] = useState("");
  const [testPhone, setTestPhone] = useState("");

  function load() {
    api.get<Settings>("/api/admin/settings").then(setSettings);
  }

  useEffect(() => {
    load();
  }, []);

  if (!settings) return <div className="text-muted-foreground">Loading…</div>;

  async function saveNotifications() {
    await api.put("/api/admin/settings", {
      emailEnabled: settings!.emailEnabled,
      whatsappEnabled: settings!.whatsappEnabled,
      messageTemplate: settings!.messageTemplate,
    });
    toast.success("Notification settings saved");
  }

  async function saveCertificate() {
    await api.put("/api/admin/settings", {
      certificateTemplate: settings!.certificateTemplate,
    });
    toast.success("Certificate template saved");
  }

  return (
    <div className="stagger-children space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage participant notification channels.</p>
      </div>

      <Card className="motion-card rounded-2xl shadow-sm">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Registration Notifications</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Email is the default (Resend). WhatsApp uses Meta Cloud API — no Twilio.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant={settings.status.emailConfigured ? "success" : "outline"}>
              {settings.status.emailConfigured ? "Resend Connected" : "Resend not configured"}
            </Badge>
            <Badge variant={settings.status.whatsappConfigured ? "success" : "outline"}>
              {settings.status.whatsappConfigured ? "WhatsApp Connected" : "WhatsApp not configured"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <label className="flex items-center justify-between gap-4">
            <div>
              <div className="font-medium text-sm">Enable email notifications</div>
              <p className="text-sm text-muted-foreground">
                Send a confirmation message to each new registrant
              </p>
            </div>
            <Switch
              checked={settings.emailEnabled}
              onCheckedChange={(emailEnabled) => setSettings({ ...settings, emailEnabled })}
            />
          </label>
          <label className="flex items-center justify-between gap-4">
            <div>
              <div className="font-medium text-sm">Enable WhatsApp notifications</div>
              <p className="text-sm text-muted-foreground">
                Optional. Requires Meta Cloud API token and phone number ID.
              </p>
            </div>
            <Switch
              checked={settings.whatsappEnabled}
              onCheckedChange={(whatsappEnabled) => setSettings({ ...settings, whatsappEnabled })}
            />
          </label>
          <div className="space-y-1.5">
            <Label>Message template</Label>
            <Textarea
              rows={4}
              value={settings.messageTemplate}
              onChange={(e) => setSettings({ ...settings, messageTemplate: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Placeholders: {"{{name}}"}, {"{{event}}"}, {"{{date}}"}, {"{{location}}"},{" "}
              {"{{registrationId}}"}
            </p>
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Button
              type="button"
              variant="link"
              className="justify-start px-0"
              onClick={() =>
                setSettings({ ...settings, messageTemplate: DEFAULT_MESSAGE_TEMPLATE })
              }
            >
              Reset to default
            </Button>
            <Button className="h-11 w-full sm:w-auto" onClick={saveNotifications}>
              Save Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="motion-card rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle>Send Test Message</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <form
            className="space-y-2"
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await api.post("/api/admin/settings/test", { channel: "email", to: testEmail });
                toast.success("Test email sent");
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Send failed");
              }
            }}
          >
            <Label>Email</Label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                type="email"
                required
                className="h-11"
                placeholder="you@example.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
              />
              <Button type="submit" className="h-11 w-full shrink-0 sm:w-auto">
                Send Test
              </Button>
            </div>
          </form>
          <form
            className="space-y-2"
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await api.post("/api/admin/settings/test", { channel: "whatsapp", to: testPhone });
                toast.success("Test WhatsApp sent");
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Send failed");
              }
            }}
          >
            <Label>WhatsApp</Label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                required
                className="h-11"
                placeholder="e.g. +85291234567 (with country code)"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
              />
              <Button type="submit" variant="outline" className="h-11 w-full shrink-0 sm:w-auto">
                Send Test
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="motion-card rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle>Certificate Template</CardTitle>
          <p className="text-sm text-muted-foreground">
            Changes apply to every new certificate download. Name, event, date, location and ID
            stay bound to the registration.
          </p>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-3">
            {(
              [
                ["heading", "Heading"],
                ["intro", "Intro line"],
                ["body", "Body line"],
                ["issuer", "Issuer"],
                ["footer", "Footer (optional)"],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="space-y-1.5">
                <Label>{label}</Label>
                <Input
                  value={settings.certificateTemplate[key]}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      certificateTemplate: {
                        ...settings.certificateTemplate,
                        [key]: e.target.value,
                      },
                    })
                  }
                />
              </div>
            ))}
            <div className="space-y-1.5">
              <Label>Accent color</Label>
              <Input
                type="color"
                className="h-10 w-20 p-1"
                value={settings.certificateTemplate.accentColor}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    certificateTemplate: {
                      ...settings.certificateTemplate,
                      accentColor: e.target.value,
                    },
                  })
                }
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Placeholders: {"{{name}}"}, {"{{event}}"}, {"{{date}}"}, {"{{location}}"},{" "}
              {"{{registrationId}}"}
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                className="h-10"
                onClick={() =>
                  setSettings({
                    ...settings,
                    certificateTemplate: { ...DEFAULT_CERTIFICATE_TEMPLATE },
                  })
                }
              >
                Reset to default
              </Button>
              <Button className="h-10" onClick={saveCertificate}>
                Save Template
              </Button>
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">Preview</p>
            {/*
              Scale the full design-width certificate uniformly so preview layout
              matches /certificate/:id (no compact padding / aspect divergence).
            */}
            <div
              className="@container relative w-full overflow-hidden"
              style={{ aspectRatio: "1.414" }}
            >
              <div
                className="origin-top-left"
                style={{
                  width: CERTIFICATE_DESIGN_WIDTH,
                  // length/length → unitless number (scale() rejects length units)
                  transform: `scale(calc(100cqw / ${CERTIFICATE_DESIGN_WIDTH}px))`,
                }}
              >
                <CertificateView
                  name="Lee Lok San"
                  eventTitle="Sharing for AiTLE AI for All Subject & Admin Summit"
                  dateLabel="August 29th, 2026 9:30 AM – 5:00 PM"
                  location="Ying Wa College"
                  registrationId="AB12CD34"
                  template={settings.certificateTemplate}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="motion-card rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle>How to set up notifications</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-3 text-muted-foreground">
          <p>
            <strong className="text-foreground">Email —</strong> create a free Resend account, add
            `RESEND_API_KEY` (and optionally `RESEND_FROM`) as Wrangler secrets.
          </p>
          <p>
            <strong className="text-foreground">WhatsApp —</strong> create a Meta app, add WhatsApp,
            copy the Cloud API token and Phone Number ID into `WHATSAPP_TOKEN` and
            `WHATSAPP_PHONE_NUMBER_ID`. For production, set `WHATSAPP_TEMPLATE_NAME` to an approved
            Utility template with five body variables.
          </p>
          <p>
            Event Promote still works with a free `wa.me` share link even when the API is not
            connected.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

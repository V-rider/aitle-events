import { toPng } from "html-to-image";
import { Download, Printer } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { CertificateView } from "@/components/CertificateView";
import { FadeIn, PageMotion } from "@/components/PageMotion";
import { Button } from "@/components/ui/button";
import type { CertificatePayload } from "@/lib/types";

export function Certificate() {
  const { id } = useParams();
  const [data, setData] = useState<CertificatePayload | null>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "missing" | "unavailable">("loading");

  useEffect(() => {
    if (!id) return;
    fetch(`/api/certificates/${id}`, { credentials: "include" })
      .then(async (res) => {
        const body = (await res.json()) as CertificatePayload & { error?: string };
        if (res.status === 404) {
          setStatus("missing");
          return;
        }
        setData(body);
        setStatus(res.ok ? "ok" : "unavailable");
      })
      .catch(() => setStatus("missing"));
  }, [id]);

  async function download() {
    const node = document.getElementById("certificate");
    if (!node) return;
    const dataUrl = await toPng(node, { pixelRatio: 2, cacheBust: true });
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `aitle-certificate-${data?.registrationId ?? "download"}.png`;
    a.click();
  }

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Loading certificate…
      </div>
    );
  }

  if (status === "missing") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <PageMotion className="p-8 text-center">
          <img src="/aitle-logo.png" alt="AiTLE" className="mx-auto mb-4 h-8" />
          <p className="font-medium">Certificate not found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            This registration ID does not exist.
          </p>
        </PageMotion>
      </div>
    );
  }

  if (status === "unavailable" && data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <PageMotion className="max-w-sm p-8 text-center">
          <p className="text-lg font-semibold">Certificate Not Available</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Your certificate for <strong>{data.eventTitle}</strong> will be available after
            attendance is confirmed.
          </p>
        </PageMotion>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="flex min-h-dvh flex-col bg-slate-100">
      <FadeIn className="no-print sticky top-0 z-20 flex flex-col gap-3 border-b bg-white/95 px-4 py-3 backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-2">
          <img src="/aitle-logo.png" alt="AiTLE" className="h-6 w-auto shrink-0" />
          <span className="truncate text-sm font-medium">Certificate of Attendance</span>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0">
          <Button variant="outline" size="sm" className="h-10" onClick={() => window.print()}>
            <Printer className="mr-1.5 h-4 w-4" />
            Print
          </Button>
          <Button size="sm" className="h-10" onClick={download}>
            <Download className="mr-1.5 h-4 w-4" />
            Download
          </Button>
        </div>
      </FadeIn>
      <div className="flex flex-1 items-start justify-center overflow-x-auto p-3 sm:items-center sm:p-6 print:p-0">
        <FadeIn delay={0.12} className="w-full min-w-[320px] max-w-[900px]">
          <CertificateView
            name={data.name}
            eventTitle={data.eventTitle}
            dateLabel={data.dateLabel}
            location={data.location}
            registrationId={data.registrationId}
            template={data.template}
          />
        </FadeIn>
      </div>
    </div>
  );
}

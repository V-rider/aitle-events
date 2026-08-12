import { toPng } from "html-to-image";
import { Download, Printer } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { CertificateView } from "@/components/CertificateView";
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
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Loading certificate…
      </div>
    );
  }

  if (status === "missing") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8">
          <img src="/aitle-logo.png" alt="AiTLE" className="h-8 mx-auto mb-4" />
          <p className="font-medium">Certificate not found</p>
          <p className="text-sm text-muted-foreground mt-1">
            This registration ID does not exist.
          </p>
        </div>
      </div>
    );
  }

  if (status === "unavailable" && data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8 max-w-sm">
          <p className="font-semibold text-lg">Certificate Not Available</p>
          <p className="text-sm text-muted-foreground mt-2">
            Your certificate for <strong>{data.eventTitle}</strong> will be available after
            attendance is confirmed.
          </p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="flex min-h-dvh flex-col bg-slate-100">
      <div className="no-print sticky top-0 z-20 flex flex-col gap-3 border-b bg-white/95 px-4 py-3 backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-2">
          <img src="/aitle-logo.png" alt="AiTLE" className="h-6 w-auto" />
          <span className="text-sm font-medium">Certificate of Attendance</span>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <Button variant="outline" size="sm" className="h-10" onClick={() => window.print()}>
            <Printer className="mr-1.5 h-4 w-4" />
            Print
          </Button>
          <Button size="sm" className="h-10" onClick={download}>
            <Download className="mr-1.5 h-4 w-4" />
            Download
          </Button>
        </div>
      </div>
      <div className="flex flex-1 items-start justify-center overflow-x-auto p-3 sm:items-center sm:p-6 print:p-0">
        <div className="w-full min-w-[320px] max-w-[900px]">
          <CertificateView
            name={data.name}
            eventTitle={data.eventTitle}
            dateLabel={data.dateLabel}
            location={data.location}
            registrationId={data.registrationId}
            template={data.template}
          />
        </div>
      </div>
    </div>
  );
}

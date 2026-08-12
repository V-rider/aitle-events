import { Calendar, MapPin } from "lucide-react";
import { applyTemplate } from "@/lib/utils";
import type { CertificateTemplate } from "@/lib/types";

export interface CertificateViewProps {
  name: string;
  eventTitle: string;
  dateLabel: string;
  location: string;
  registrationId: string;
  template: CertificateTemplate;
}

/** Design width used for layout; preview may CSS-scale this whole card. */
export const CERTIFICATE_DESIGN_WIDTH = 900;

export function CertificateView({
  name,
  eventTitle,
  dateLabel,
  location,
  registrationId,
  template,
}: CertificateViewProps) {
  const vars = { name, event: eventTitle, date: dateLabel, location, registrationId };
  const heading = applyTemplate(template.heading, vars);
  const intro = applyTemplate(template.intro, vars);
  const body = applyTemplate(template.body, vars);
  const issuer = applyTemplate(template.issuer, vars);
  const footer = applyTemplate(template.footer, vars);
  const color = template.accentColor || "#1d4ed8";
  const titleClass =
    eventTitle.length > 90 ? "text-base" : eventTitle.length > 55 ? "text-lg" : "text-2xl";

  return (
    <div
      id="certificate"
      className="relative w-full max-w-[900px] aspect-[1.414] bg-white border shadow-sm overflow-hidden"
      style={{ color }}
    >
      {/* Decorative double border — content must stay inside inset-4 */}
      <div className="absolute inset-3 border-2 rounded-sm pointer-events-none" style={{ borderColor: `${color}4D` }} />
      <div className="absolute inset-4 border rounded-sm pointer-events-none" style={{ borderColor: `${color}26` }} />
      <Corner className="top-6 left-6" color={color} />
      <Corner className="top-6 right-6 rotate-90" color={color} />
      <Corner className="bottom-6 left-6 -rotate-90" color={color} />
      <Corner className="bottom-6 right-6 rotate-180" color={color} />
      {/*
        Content inset clears inner border (inset-4 / 16px) and corner ornaments
        (top-6 + h-8 ≈ 56px). Absolute box keeps logo/text inside the double border.
      */}
      <div className="absolute inset-14 flex flex-col items-center justify-center px-2 sm:px-4 text-center text-slate-800">
        <img
          src="/aitle-logo.png"
          alt="AiTLE"
          className="h-10 sm:h-12 w-auto mb-4 object-contain shrink-0"
        />
        <div className="flex items-center gap-3 mb-3 w-full max-w-xs shrink-0">
          <div className="h-px flex-1" style={{ background: `${color}40` }} />
          <div className="h-1.5 w-1.5 rounded-full" style={{ background: `${color}66` }} />
          <div className="h-px flex-1" style={{ background: `${color}40` }} />
        </div>
        <p className="text-[11px] uppercase tracking-[0.3em] mb-1.5 shrink-0" style={{ color: `${color}cc` }}>
          {heading}
        </p>
        <p className="text-sm text-muted-foreground mb-3 shrink-0">{intro}</p>
        <h1
          className="text-3xl sm:text-4xl font-bold text-foreground leading-tight break-words max-w-xl shrink-0"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          {name}
        </h1>
        <div className="h-0.5 w-full max-w-md mt-2 mb-3 bg-gradient-to-r from-transparent via-current to-transparent opacity-40 shrink-0" />
        <p className="text-sm text-muted-foreground mb-3 shrink-0">{body}</p>
        <p className={`font-semibold mb-4 max-w-xl leading-snug break-words shrink-0 ${titleClass}`} style={{ color }}>
          {eventTitle}
        </p>
        <div className="flex flex-wrap justify-center gap-x-5 gap-y-1 text-xs sm:text-sm text-muted-foreground mb-5 max-w-xl shrink-0">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" style={{ color: `${color}99` }} />
            {dateLabel}
          </span>
          {location ? (
            <span className="flex items-start gap-1.5 text-center">
              <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: `${color}99` }} />
              {location}
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-3 w-full max-w-md shrink-0">
          <div className="h-px flex-1 bg-border" />
          <div className="text-center shrink-0">
            <p className="text-xs text-muted-foreground">
              Registration ID: <span className="font-mono font-medium text-foreground">#{registrationId}</span>
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Issued by {issuer}</p>
            {footer ? <p className="text-[10px] text-muted-foreground/80 mt-0.5">{footer}</p> : null}
          </div>
          <div className="h-px flex-1 bg-border" />
        </div>
      </div>
    </div>
  );
}

function Corner({ className, color }: { className: string; color: string }) {
  return (
    <svg
      className={`absolute h-8 w-8 ${className}`}
      viewBox="0 0 16 16"
      fill="none"
      style={{ color }}
    >
      <path
        d="M4 4 L4 12 M4 4 L12 4 M4 4 L10 10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.35"
      />
    </svg>
  );
}

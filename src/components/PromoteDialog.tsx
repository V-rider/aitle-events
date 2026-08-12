import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { EventItem } from "@/lib/types";

export function PromoteDialog({
  event,
  onClose,
}: {
  event: EventItem;
  onClose: () => void;
}) {
  const url = `${window.location.origin}/events/${event.slug}`;
  const [message, setMessage] = useState(
    `You're invited to ${event.title} on ${event.dateLabel}${event.location ? ` at ${event.location}` : ""}. Register here: ${url}`,
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="promote-dialog-title"
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border sm:hidden" />
        <h2 id="promote-dialog-title" className="text-lg font-semibold">
          Promote on WhatsApp
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          A ready-to-share message with the registration link. Edit it if you like, then copy it
          or send it through WhatsApp.
        </p>
        <Textarea
          className="mt-4 min-h-32"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
        />
        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
          <Button variant="outline" className="h-11 w-full sm:w-auto" onClick={onClose}>
            Close
          </Button>
          <Button
            variant="outline"
            className="h-11 w-full sm:w-auto"
            onClick={() => navigator.clipboard.writeText(message)}
          >
            Copy
          </Button>
          <Button className="h-11 w-full sm:w-auto" asChild>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(message)}`}
              target="_blank"
              rel="noreferrer"
            >
              Send via WhatsApp
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}

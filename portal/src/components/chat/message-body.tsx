import { Fragment } from "react";
import { segmentMessageBody } from "@/lib/messages";

/** Renders a plain-text message body: line breaks kept, URLs linked, and
 *  everything else emitted as text nodes so nothing is ever interpreted as
 *  markup. */
export function MessageBody({ body, className }: { body: string; className?: string }) {
  return (
    <p className={className}>
      {segmentMessageBody(body).map((seg, i) => {
        if (seg.type === "break") return <br key={i} />;
        if (seg.type === "link") {
          return (
            <a key={i} href={seg.href} target="_blank" rel="noopener noreferrer nofollow" className="break-all underline underline-offset-2 hover:opacity-80">
              {seg.label}
            </a>
          );
        }
        return <Fragment key={i}>{seg.value}</Fragment>;
      })}
    </p>
  );
}

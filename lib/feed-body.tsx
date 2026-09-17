import { Fragment } from "react";

const HASHTAG_RE = /#([\w\u00C0-\u024F]+)/g;

/** Render post body with highlighted hashtags. */
export function renderFeedBody(body: string) {
  const parts: React.ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  const re = new RegExp(HASHTAG_RE.source, "g");

  while ((match = re.exec(body)) !== null) {
    if (match.index > last) {
      parts.push(body.slice(last, match.index));
    }
    parts.push(
      <span key={`${match.index}-${match[1]}`} className="font-medium text-accent">
        #{match[1]}
      </span>
    );
    last = match.index + match[0].length;
  }

  if (last < body.length) {
    parts.push(body.slice(last));
  }

  return parts.length ? parts.map((p, i) => <Fragment key={i}>{p}</Fragment>) : body;
}

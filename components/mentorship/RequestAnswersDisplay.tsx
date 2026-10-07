import {
  MENTORSHIP_REQUEST_QUESTIONS,
  formatAnswerForDisplay,
  isLegacyRequestAnswers,
  type MentorshipRequestAnswers,
} from "@/lib/mentorship-request-form";

function LegacyAnswers({
  requestAnswers,
}: {
  requestAnswers: MentorshipRequestAnswers;
}) {
  return (
    <>
      {Object.entries(requestAnswers).map(([key, val]) => (
        <div key={key}>
          <p className="text-muted">{key.replace(/_/g, " ")}</p>
          <p className="mt-0.5 whitespace-pre-wrap text-primary">
            {formatAnswerForDisplay(key, val)}
          </p>
        </div>
      ))}
    </>
  );
}

export function RequestAnswersDisplay({
  requestAnswers,
}: {
  requestAnswers: MentorshipRequestAnswers | null | undefined;
}) {
  if (!requestAnswers || typeof requestAnswers !== "object") return null;

  const legacy = isLegacyRequestAnswers(requestAnswers);

  return (
    <div className="mt-3 space-y-4 rounded-lg border border-primary/10 bg-surface/50 p-4 text-sm">
      <p className="font-medium text-primary">Training requirements</p>

      {legacy ? (
        <LegacyAnswers requestAnswers={requestAnswers} />
      ) : (
        MENTORSHIP_REQUEST_QUESTIONS.map((q, qi) => (
          <div key={q.id} className="space-y-2 border-t border-primary/10 pt-3 first:border-0 first:pt-0">
            <p className="font-medium text-primary/90">
              {qi + 1}. {q.label}
            </p>
            {q.fields.map((f) => {
              const raw = requestAnswers[f.id];
              const isUrl =
                f.type === "url" &&
                typeof raw === "string" &&
                raw.trim().length > 0;

              return (
                <div key={f.id}>
                  {f.label && <p className="text-muted">{f.label}</p>}
                  {isUrl ? (
                    <a
                      href={raw.trim()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-0.5 block break-all text-accent underline"
                    >
                      {raw.trim()}
                    </a>
                  ) : (
                    <p className="mt-0.5 whitespace-pre-wrap text-primary">
                      {formatAnswerForDisplay(f.id, raw)}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        ))
      )}
    </div>
  );
}

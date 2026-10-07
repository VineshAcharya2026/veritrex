"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import {
  GENTLE_COMMITMENT_OPTIONS,
  GENTLE_COMMITMENT_TEXT,
  LEADERSHIP_LONELINESS_OPTIONS,
  REFLECTION_FORM_DESCRIPTION,
  REFLECTION_SECTIONS,
  SUPPORT_WAYS,
  VALUED_QUALITIES,
} from "@/lib/reflection-constants";

type FormState = {
  introduction: string;
  proudestAchievement: string;
  guidingValues: string;
  standFor: string;
  admiredPerson: string;
  meaningPurpose: string;
  dreamMission: string;
  societalAspiration: string;
  othersDescribeYou: string;
  valuedQualities: string[];
  energizingPeople: string;
  differentBeliefsApproach: string;
  confidentialityImportance: string;
  supportWays: string[];
  contributions: string;
  leadershipLoneliness: string;
  supportNeeded: string;
  sharingTopics: string;
  rememberedFor: string;
  additionalNotes: string;
  gentleCommitment: string;
};

const emptyForm: FormState = {
  introduction: "",
  proudestAchievement: "",
  guidingValues: "",
  standFor: "",
  admiredPerson: "",
  meaningPurpose: "",
  dreamMission: "",
  societalAspiration: "",
  othersDescribeYou: "",
  valuedQualities: [],
  energizingPeople: "",
  differentBeliefsApproach: "",
  confidentialityImportance: "",
  supportWays: [],
  contributions: "",
  leadershipLoneliness: "",
  supportNeeded: "",
  sharingTopics: "",
  rememberedFor: "",
  additionalNotes: "",
  gentleCommitment: "",
};

function ReflectionField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {hint && <p className="text-xs text-muted">{hint}</p>}
      <Textarea value={value} onChange={(e) => onChange(e.target.value)} rows={4} />
    </div>
  );
}

function CheckboxGroup({
  label,
  hint,
  options,
  values,
  max,
  onChange,
}: {
  label: string;
  hint?: string;
  options: readonly string[];
  values: string[];
  max?: number;
  onChange: (v: string[]) => void;
}) {
  function toggle(option: string) {
    if (values.includes(option)) {
      onChange(values.filter((v) => v !== option));
      return;
    }
    if (max && values.length >= max) return;
    onChange([...values, option]);
  }

  return (
    <div className="space-y-3">
      <div>
        <Label>{label}</Label>
        {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
        {max && (
          <p className="mt-1 text-xs text-muted">
            Selected {values.length} of {max}
          </p>
        )}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((option) => {
          const checked = values.includes(option);
          const disabled = !checked && !!max && values.length >= max;
          return (
            <label
              key={option}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
                checked ? "border-accent bg-accent/5 text-primary" : "border-primary/10 hover:border-primary/20",
                disabled && "cursor-not-allowed opacity-50"
              )}
            >
              <input
                type="checkbox"
                className="accent-accent"
                checked={checked}
                disabled={disabled}
                onChange={() => toggle(option)}
              />
              {option}
            </label>
          );
        })}
      </div>
    </div>
  );
}

function RadioGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-3">
      <Label>{label}</Label>
      <div className="space-y-2">
        {options.map((option) => (
          <label
            key={option.value}
            className={cn(
              "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
              value === option.value ? "border-accent bg-accent/5" : "border-primary/10 hover:border-primary/20"
            )}
          >
            <input
              type="radio"
              name={label}
              className="accent-accent"
              checked={value === option.value}
              onChange={() => onChange(option.value)}
            />
            {option.label}
          </label>
        ))}
      </div>
    </div>
  );
}

export function MemberReflectionForm() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [completedAt, setCompletedAt] = useState<string | null>(null);
  const [reviewStatus, setReviewStatus] = useState<string | null>(null);
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/member/reflection")
      .then((r) => r.json())
      .then((data) => {
        if (data?.id) {
          setForm({
            introduction: data.introduction ?? "",
            proudestAchievement: data.proudestAchievement ?? "",
            guidingValues: data.guidingValues ?? "",
            standFor: data.standFor ?? "",
            admiredPerson: data.admiredPerson ?? "",
            meaningPurpose: data.meaningPurpose ?? "",
            dreamMission: data.dreamMission ?? "",
            societalAspiration: data.societalAspiration ?? "",
            othersDescribeYou: data.othersDescribeYou ?? "",
            valuedQualities: data.valuedQualities ?? [],
            energizingPeople: data.energizingPeople ?? "",
            differentBeliefsApproach: data.differentBeliefsApproach ?? "",
            confidentialityImportance: data.confidentialityImportance?.toString() ?? "",
            supportWays: data.supportWays ?? [],
            contributions: data.contributions ?? "",
            leadershipLoneliness: data.leadershipLoneliness ?? "",
            supportNeeded: data.supportNeeded ?? "",
            sharingTopics: data.sharingTopics ?? "",
            rememberedFor: data.rememberedFor ?? "",
            additionalNotes: data.additionalNotes ?? "",
            gentleCommitment: data.gentleCommitment ?? "",
          });
          setCompletedAt(data.completedAt ?? null);
          setReviewStatus(data.reviewStatus ?? null);
          setSubmittedAt(data.submittedAt ?? null);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  function patchForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  function payload(submit: boolean) {
    return {
      ...form,
      confidentialityImportance: form.confidentialityImportance
        ? Number(form.confidentialityImportance)
        : null,
      leadershipLoneliness: form.leadershipLoneliness || null,
      gentleCommitment: form.gentleCommitment || null,
      submit,
    };
  }

  async function save(submit: boolean) {
    setSaving(true);
    setError("");
    setSaved(false);
    const res = await fetch("/api/member/reflection", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload(submit)),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      const msg =
        typeof data.error === "string"
          ? data.error
          : data.error?.formErrors?.[0] || data.error?.fieldErrors?.valuedQualities?.[0] || "Failed to save";
      setError(msg);
      return;
    }
    setCompletedAt(data.completedAt ?? null);
    setReviewStatus(data.reviewStatus ?? null);
    setSubmittedAt(data.submittedAt ?? null);
    setSaved(true);
    if (submit) setStep(REFLECTION_SECTIONS.length - 1);
  }

  const section = REFLECTION_SECTIONS[step];
  const isLast = step === REFLECTION_SECTIONS.length - 1;

  if (loading) {
    return <div className="h-48 animate-pulse rounded-xl bg-primary/5" />;
  }

  if (reviewStatus === "PENDING") {
    const when = submittedAt || completedAt;
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <PageHeader
          title="Inner Circle (Community)"
          description="Your application has been received."
        />
        <div className="rounded-xl border border-primary/8 bg-white p-8 shadow-card space-y-4 text-center">
          <h2 className="text-lg font-semibold text-primary">Your application is under review.</h2>
          <p className="text-sm text-muted">
            We will update you once you are selected for the Inner Circle community.
          </p>
          {when && (
            <p className="text-xs text-muted">
              Submitted {new Date(when).toLocaleDateString()}
            </p>
          )}
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Link
              href="/dashboard/friends"
              className="text-sm font-medium text-accent hover:underline"
            >
              Find friends
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (reviewStatus === "APPROVED") {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <PageHeader
          title="Inner Circle (Community)"
          description="Welcome to the circle."
        />
        <Alert variant="success">
          Welcome to the Inner Circle. Your application was approved.
        </Alert>
        <p className="text-sm text-muted">
          Explore the community feed, connect with members, and share your journey.
        </p>
        <Link href="/dashboard/friends" className="text-sm font-medium text-accent hover:underline">
          Find friends
        </Link>
      </div>
    );
  }

  if (reviewStatus === "REJECTED") {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <PageHeader
          title="Inner Circle (Community)"
          description="Revise and resubmit your application."
        />
        <Alert variant="error">
          Your previous application was not selected. You may update your answers and submit again.
        </Alert>
        <Button type="button" variant="accent" onClick={() => setReviewStatus(null)}>
          Revise application
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Inner Circle (Community)"
        description="Share your story so we can build authentic connections in the circle. There are no right or wrong answers."
      />

      <p className="rounded-xl border border-primary/8 bg-accent/5 px-4 py-3 text-sm text-muted">
        {REFLECTION_FORM_DESCRIPTION}
      </p>

      {completedAt && !reviewStatus && (
        <Alert variant="success">
          Draft saved. Submit your application when you are ready.
        </Alert>
      )}
      {saved && <Alert variant="success">{isLast ? "Application submitted." : "Draft saved."}</Alert>}
      {error && <Alert variant="error">{error}</Alert>}

      <div className="flex flex-wrap gap-2">
        {REFLECTION_SECTIONS.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setStep(i)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors",
              i === step ? "bg-accent text-white" : "bg-primary/5 text-muted hover:bg-primary/10"
            )}
          >
            {i + 1}. {s.title}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          save(isLast);
        }}
        className="space-y-6 rounded-xl border border-primary/8 bg-white p-6 shadow-card"
      >
        <div>
          <h2 className="text-lg font-semibold text-primary">{section.title}</h2>
          <p className="text-sm text-muted">{section.description}</p>
        </div>

        {section.id === "identity" && (
          <ReflectionField
            label="1. Please introduce yourself."
            hint="Name, role, organisation, city, and anything else you would like us to know."
            value={form.introduction}
            onChange={(v) => patchForm("introduction", v)}
          />
        )}

        {section.id === "values" && (
          <div className="space-y-6">
            <ReflectionField
              label="2. What are you most proud of in your life so far?"
              value={form.proudestAchievement}
              onChange={(v) => patchForm("proudestAchievement", v)}
            />
            <ReflectionField
              label="3. What values or principles guide your life and decisions?"
              value={form.guidingValues}
              onChange={(v) => patchForm("guidingValues", v)}
            />
            <ReflectionField
              label="4. What do you stand for?"
              value={form.standFor}
              onChange={(v) => patchForm("standFor", v)}
            />
            <ReflectionField
              label="5. Who do you admire most, and why?"
              value={form.admiredPerson}
              onChange={(v) => patchForm("admiredPerson", v)}
            />
            <ReflectionField
              label="6. What gives your life meaning and purpose today?"
              value={form.meaningPurpose}
              onChange={(v) => patchForm("meaningPurpose", v)}
            />
            <ReflectionField
              label="7. Is there a dream, mission, or cause that is close to your heart?"
              value={form.dreamMission}
              onChange={(v) => patchForm("dreamMission", v)}
            />
            <ReflectionField
              label="8. Is there something you wish to do for society or future generations but have not yet found the time or opportunity to pursue?"
              value={form.societalAspiration}
              onChange={(v) => patchForm("societalAspiration", v)}
            />
            <ReflectionField
              label="9. How would your family, friends, or colleagues describe you?"
              value={form.othersDescribeYou}
              onChange={(v) => patchForm("othersDescribeYou", v)}
            />
          </div>
        )}

        {section.id === "people" && (
          <div className="space-y-6">
            <CheckboxGroup
              label="10. What qualities do you value most in people?"
              hint="Select up to five"
              options={VALUED_QUALITIES}
              values={form.valuedQualities}
              max={5}
              onChange={(v) => patchForm("valuedQualities", v)}
            />
            <ReflectionField
              label="11. What kind of people energise you, and what kind of behaviour do you find difficult to relate to?"
              value={form.energizingPeople}
              onChange={(v) => patchForm("energizingPeople", v)}
            />
            <ReflectionField
              label="12. When you encounter people with different beliefs, backgrounds, or opinions, how do you generally approach them?"
              value={form.differentBeliefsApproach}
              onChange={(v) => patchForm("differentBeliefsApproach", v)}
            />
          </div>
        )}

        {section.id === "support" && (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>13. Trust is central to this community. How important is confidentiality and discretion to you?</Label>
              <p className="text-xs text-muted">Scale 1 (not important) to 10 (essential)</p>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={form.confidentialityImportance || "5"}
                  onChange={(e) => patchForm("confidentialityImportance", e.target.value)}
                  className="w-full accent-accent"
                />
                <span className="w-8 text-center text-sm font-semibold text-primary">
                  {form.confidentialityImportance || "5"}
                </span>
              </div>
            </div>
            <CheckboxGroup
              label="14. In what ways would you be happy to support fellow members?"
              hint="Check all that apply"
              options={SUPPORT_WAYS}
              values={form.supportWays}
              onChange={(v) => patchForm("supportWays", v)}
            />
            <ReflectionField
              label="15. What knowledge, experience, or network do you feel you can contribute to the community?"
              value={form.contributions}
              onChange={(v) => patchForm("contributions", v)}
            />
            <RadioGroup
              label="16. Have you experienced leadership loneliness or wished for a circle of trusted peers?"
              options={LEADERSHIP_LONELINESS_OPTIONS}
              value={form.leadershipLoneliness}
              onChange={(v) => patchForm("leadershipLoneliness", v)}
            />
            <ReflectionField
              label="17. What kind of support would you value most from fellow members?"
              value={form.supportNeeded}
              onChange={(v) => patchForm("supportNeeded", v)}
            />
          </div>
        )}

        {section.id === "community" && (
          <div className="space-y-6">
            <ReflectionField
              label="18. What topics or experiences would you enjoy sharing with the community?"
              hint="Examples: intimate dinners, high tea conversations, books, travel, family, health, AI, spirituality, entrepreneurship, education, philanthropy, retreats, etc."
              value={form.sharingTopics}
              onChange={(v) => patchForm("sharingTopics", v)}
            />
            <ReflectionField
              label="19. If people remember you twenty years from now, what would you like to be remembered for?"
              value={form.rememberedFor}
              onChange={(v) => patchForm("rememberedFor", v)}
            />
            <ReflectionField
              label="20. Is there anything else you would like us to know, or any suggestions for building a warm, trusted, and meaningful community?"
              value={form.additionalNotes}
              onChange={(v) => patchForm("additionalNotes", v)}
            />
          </div>
        )}

        {section.id === "commitment" && (
          <div className="space-y-4">
            <p className="rounded-lg border border-primary/10 bg-primary/5 px-4 py-3 text-sm text-primary">
              {GENTLE_COMMITMENT_TEXT}
            </p>
            <RadioGroup
              label="Gentle commitment (required to submit)"
              options={GENTLE_COMMITMENT_OPTIONS}
              value={form.gentleCommitment}
              onChange={(v) => patchForm("gentleCommitment", v)}
            />
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-primary/8 pt-4">
          <Button
            type="button"
            variant="outline"
            disabled={step === 0}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
          >
            Previous
          </Button>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => save(false)}
            >
              Save draft
            </Button>
            {!isLast ? (
              <Button
                type="button"
                variant="accent"
                onClick={() => {
                  save(false);
                  setStep((s) => Math.min(REFLECTION_SECTIONS.length - 1, s + 1));
                }}
              >
                Next
              </Button>
            ) : (
              <Button type="submit" variant="accent" disabled={saving}>
                Submit application
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  CURRENT_STATUS_OPTIONS,
  QUALIFICATION_OPTIONS,
  YEARS_OF_EXPERIENCE_OPTIONS,
  GUIDANCE_OPTIONS,
  MODE_OPTIONS,
  LANGUAGE_OPTIONS,
  INDUSTRY_OPTIONS,
  COUNTRY_OPTIONS,
} from "@/lib/mentee-onboarding";
import {
  isValidPhone,
  PHONE_INVALID_MSG,
  sanitizePhoneInput,
} from "@/lib/validators/phone";

const STEPS = [
  "Identity & Location",
  "Education & Work",
  "Goals & Guidance",
  "Preferences & Language",
  "Reflection",
] as const;

type FormState = {
  firstName: string;
  lastName: string;
  preferredName: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  currentStatus: string;
  highestQualification: string;
  currentInstitution: string;
  currentDesignation: string;
  yearsOfExperience: string;
  preferredIndustry: string;
  careerGoal: string;
  guidanceAreas: string[];
  skillsToDevelo: string;
  preferredMentorProfile: string;
  preferredModes: string[];
  languages: string[];
  biggestChallenge: string;
  successDefinition: string;
};

const defaultForm: FormState = {
  firstName: "", lastName: "", preferredName: "", email: "", phone: "",
  country: "", city: "", currentStatus: "", highestQualification: "",
  currentInstitution: "", currentDesignation: "", yearsOfExperience: "",
  preferredIndustry: "", careerGoal: "", guidanceAreas: [], skillsToDevelo: "",
  preferredMentorProfile: "", preferredModes: [], languages: [],
  biggestChallenge: "", successDefinition: "",
};

function CheckboxGroup({
  options,
  selected,
  onChange,
  max,
}: {
  options: string[];
  selected: string[];
  onChange: (v: string[]) => void;
  max?: number;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = selected.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => {
              if (active) onChange(selected.filter((s) => s !== opt));
              else if (!max || selected.length < max) onChange([...selected, opt]);
            }}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              active
                ? "border-accent bg-accent/10 text-accent"
                : "border-primary/15 text-muted hover:border-accent/40"
            )}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function Select({
  value,
  onChange,
  options,
  placeholder = "Select",
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <select
      className="flex h-10 w-full rounded-sm border border-primary/15 bg-white px-3 text-sm"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function toDropdown(values: string[]) {
  return values.map((v) => ({ value: v, label: v }));
}

export default function MenteeOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/mentee/profile")
      .then((r) => r.json())
      .then((p) => {
        setForm({
          firstName: p.firstName || "",
          lastName: p.lastName || "",
          preferredName: p.preferredName || "",
          email: p.email || "",
          phone: p.phone || "",
          country: p.country || "",
          city: p.city || "",
          currentStatus: p.currentStatus || "",
          highestQualification: p.highestQualification || "",
          currentInstitution: p.currentInstitution || "",
          currentDesignation: p.currentDesignation || "",
          yearsOfExperience: p.yearsOfExperience || "",
          preferredIndustry: p.preferredIndustry || "",
          careerGoal: p.careerGoal || "",
          guidanceAreas: p.guidanceAreas || [],
          skillsToDevelo: (p.skillsToDevelo || []).join(", "),
          preferredMentorProfile: p.preferredMentorProfile || "",
          preferredModes: p.preferredModes || [],
          languages: p.languages || [],
          biggestChallenge: p.biggestChallenge || "",
          successDefinition: p.successDefinition || "",
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const set = (key: keyof FormState, val: FormState[keyof FormState]) =>
    setForm((f) => ({ ...f, [key]: val }));

  const stepErrors = useMemo(() => validateStep(step, form), [step, form]);

  async function persist(): Promise<boolean> {
    setError("");
    const res = await fetch("/api/mentee/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: form.firstName,
        lastName: form.lastName,
        preferredName: form.preferredName,
        phone: form.phone,
        country: form.country,
        city: form.city,
        currentStatus: form.currentStatus || null,
        highestQualification: form.highestQualification,
        currentInstitution: form.currentInstitution,
        currentDesignation: form.currentDesignation,
        yearsOfExperience: form.yearsOfExperience,
        preferredIndustry: form.preferredIndustry,
        careerGoal: form.careerGoal,
        guidanceAreas: form.guidanceAreas,
        skillsToDevelo: form.skillsToDevelo
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        preferredMentorProfile: form.preferredMentorProfile,
        preferredModes: form.preferredModes,
        languages: form.languages,
        biggestChallenge: form.biggestChallenge,
        successDefinition: form.successDefinition,
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(typeof data.error === "string" ? data.error : "Failed to save. Please try again.");
      return false;
    }
    return true;
  }

  async function handleNext() {
    if (stepErrors.length > 0) {
      setError(stepErrors[0]);
      return;
    }
    setSaving(true);
    const ok = await persist();
    setSaving(false);
    if (ok) {
      setError("");
      setStep((s) => Math.min(s + 1, STEPS.length - 1));
    }
  }

  async function handleFinish() {
    if (stepErrors.length > 0) {
      setError(stepErrors[0]);
      return;
    }
    setSaving(true);
    const ok = await persist();
    if (!ok) {
      setSaving(false);
      return;
    }
    const check = await fetch("/api/mentee/profile").then((r) => r.json());
    setSaving(false);
    if (check.onboardingComplete) {
      router.push("/dashboard/mentee");
    } else {
      setError("Some required answers are still missing. Please review each step.");
    }
  }

  if (loading) {
    return <p className="text-muted">Loading...</p>;
  }

  const progress = Math.round(((step + 1) / STEPS.length) * 100);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Welcome — let's set up your profile"
        description="This takes about 8-10 minutes and helps us match you with the right mentors. You can update your answers anytime."
      />

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-medium text-muted">
          <span>
            Step {step + 1} of {STEPS.length}: {STEPS[step]}
          </span>
          <span>{progress}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-primary/10">
          <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <div className="space-y-4 rounded-xl border border-primary/8 bg-white p-6 shadow-card">
        {step === 0 && (
          <>
            <h3 className="font-semibold text-primary">Identity &amp; Location</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First name *</Label>
                <Input value={form.firstName} onChange={(e) => set("firstName", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Last name *</Label>
                <Input value={form.lastName} onChange={(e) => set("lastName", e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Preferred name</Label>
              <Input value={form.preferredName} placeholder="What should mentors call you?"
                onChange={(e) => set("preferredName", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={form.email} disabled />
            </div>
            <div className="space-y-2">
              <Label>Mobile number *</Label>
              <Input
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={form.phone}
                placeholder="+919876543210"
                onChange={(e) => set("phone", sanitizePhoneInput(e.target.value))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Country *</Label>
                <Select value={form.country} onChange={(v) => set("country", v)}
                  options={toDropdown(COUNTRY_OPTIONS)} />
              </div>
              <div className="space-y-2">
                <Label>City *</Label>
                <Input value={form.city} onChange={(e) => set("city", e.target.value)} />
              </div>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h3 className="font-semibold text-primary">Education &amp; Work</h3>
            <div className="space-y-2">
              <Label>Current status *</Label>
              <Select value={form.currentStatus} onChange={(v) => set("currentStatus", v)}
                options={CURRENT_STATUS_OPTIONS} />
            </div>
            <div className="space-y-2">
              <Label>Highest qualification *</Label>
              <Select value={form.highestQualification} onChange={(v) => set("highestQualification", v)}
                options={toDropdown(QUALIFICATION_OPTIONS)} />
            </div>
            <div className="space-y-2">
              <Label>Current institution / organisation *</Label>
              <Input value={form.currentInstitution} onChange={(e) => set("currentInstitution", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Current course / designation *</Label>
              <Input value={form.currentDesignation} onChange={(e) => set("currentDesignation", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Years of experience *</Label>
                <Select value={form.yearsOfExperience} onChange={(v) => set("yearsOfExperience", v)}
                  options={toDropdown(YEARS_OF_EXPERIENCE_OPTIONS)} />
              </div>
              <div className="space-y-2">
                <Label>Preferred industry *</Label>
                <Select value={form.preferredIndustry} onChange={(v) => set("preferredIndustry", v)}
                  options={toDropdown(INDUSTRY_OPTIONS)} />
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h3 className="font-semibold text-primary">Goals &amp; Guidance</h3>
            <div className="space-y-2">
              <Label>Career goal (next 3-5 years) *</Label>
              <Textarea value={form.careerGoal} rows={3} onChange={(e) => set("careerGoal", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Areas where you seek guidance (choose up to 5) *</Label>
              <CheckboxGroup options={GUIDANCE_OPTIONS} selected={form.guidanceAreas}
                onChange={(v) => set("guidanceAreas", v)} max={5} />
            </div>
            <div className="space-y-2">
              <Label>Skills you want to develop (comma-separated, up to 5) *</Label>
              <Input value={form.skillsToDevelo} placeholder="e.g. Public speaking, SQL, Negotiation"
                onChange={(e) => set("skillsToDevelo", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Preferred mentor profile (comma-separated) *</Label>
              <Input value={form.preferredMentorProfile}
                placeholder="e.g. Senior engineer, Startup founder, Ex-FAANG"
                onChange={(e) => set("preferredMentorProfile", e.target.value)} />
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h3 className="font-semibold text-primary">Preferences &amp; Language</h3>
            <div className="space-y-2">
              <Label>Preferred mentoring mode *</Label>
              <CheckboxGroup options={MODE_OPTIONS} selected={form.preferredModes}
                onChange={(v) => set("preferredModes", v)} />
            </div>
            <div className="space-y-2">
              <Label>Languages *</Label>
              <CheckboxGroup options={LANGUAGE_OPTIONS} selected={form.languages}
                onChange={(v) => set("languages", v)} />
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <h3 className="font-semibold text-primary">Reflection</h3>
            <div className="space-y-2">
              <Label>Describe your biggest career challenge today (150-200 words) *</Label>
              <Textarea value={form.biggestChallenge} rows={5}
                onChange={(e) => set("biggestChallenge", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>What would make this mentorship a success for you after six months? *</Label>
              <Textarea value={form.successDefinition} rows={4}
                onChange={(e) => set("successDefinition", e.target.value)} />
            </div>
          </>
        )}

        <div className="flex justify-between pt-2">
          <Button
            type="button"
            variant="outline"
            disabled={step === 0 || saving}
            onClick={() => {
              setError("");
              setStep((s) => Math.max(s - 1, 0));
            }}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button type="button" variant="accent" disabled={saving} onClick={handleNext}>
              {saving ? "Saving..." : "Save & continue"}
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button type="button" variant="accent" disabled={saving} onClick={handleFinish}>
              {saving ? "Saving..." : "Finish & find mentors"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function validateStep(step: number, form: FormState): string[] {
  const errors: string[] = [];
  const req = (val: string, label: string) => {
    if (!val.trim()) errors.push(`${label} is required.`);
  };
  if (step === 0) {
    req(form.firstName, "First name");
    req(form.lastName, "Last name");
    req(form.phone, "Mobile number");
    if (form.phone.trim() && !isValidPhone(form.phone)) {
      errors.push(PHONE_INVALID_MSG);
    }
    req(form.country, "Country");
    req(form.city, "City");
  } else if (step === 1) {
    req(form.currentStatus, "Current status");
    req(form.highestQualification, "Highest qualification");
    req(form.currentInstitution, "Current institution");
    req(form.currentDesignation, "Current course / designation");
    req(form.yearsOfExperience, "Years of experience");
    req(form.preferredIndustry, "Preferred industry");
  } else if (step === 2) {
    req(form.careerGoal, "Career goal");
    if (form.guidanceAreas.length === 0) errors.push("Select at least one guidance area.");
    req(form.skillsToDevelo, "Skills you want to develop");
    req(form.preferredMentorProfile, "Preferred mentor profile");
  } else if (step === 3) {
    if (form.preferredModes.length === 0) errors.push("Select at least one mentoring mode.");
    if (form.languages.length === 0) errors.push("Select at least one language.");
  } else if (step === 4) {
    req(form.biggestChallenge, "Biggest career challenge");
    req(form.successDefinition, "Success definition");
  }
  return errors;
}

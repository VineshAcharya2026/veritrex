"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { ChevronLeft } from "lucide-react";
import { CoverImageUploader } from "@/components/profile/CoverImageUploader";
import { AvatarImageUploader } from "@/components/profile/AvatarImageUploader";
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
import { sanitizePhoneInput } from "@/lib/validators/phone";

const SECTIONS = [
  "Basic Info",
  "Education & Work",
  "Career Goals",
  "Mentoring Preferences",
  "Personal",
] as const;

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
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      className="flex h-10 w-full rounded-sm border border-primary/15 bg-white px-3 text-sm"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">Select</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

const asOptions = (values: string[]) => values.map((v) => ({ value: v, label: v }));

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

export default function MenteeProfilePage() {
  const [section, setSection] = useState(0);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  function load() {
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
      });
  }

  useEffect(() => {
    load();
  }, []);

  async function save(e?: React.FormEvent) {
    e?.preventDefault();
    setError("");
    setSaved(false);
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
      setError(typeof data.error === "string" ? data.error : "Failed to save");
      return;
    }
    setSaved(true);
  }

  const set = (key: keyof FormState, val: FormState[keyof FormState]) =>
    setForm((f) => ({ ...f, [key]: val }));

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="My Profile" description="Complete your profile to get matched with the right mentors." />
      {saved && <Alert variant="success">Saved successfully.</Alert>}
      {error && <Alert variant="error">{error}</Alert>}

      <div className="flex gap-2 overflow-x-auto border-b border-primary/10 pb-2">
        {SECTIONS.map((s, i) => (
          <button key={s} type="button" onClick={() => setSection(i)}
            className={cn(
              "whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
              section === i ? "bg-accent text-white" : "text-muted hover:bg-primary/5"
            )}>
            {i + 1}. {s}
          </button>
        ))}
      </div>

      {section === 0 && (
        <form onSubmit={save} className="space-y-4 rounded-xl border border-primary/8 bg-white p-6 shadow-card">
          <h3 className="font-semibold text-primary">Basic Information</h3>
          <AvatarImageUploader displayName={`${form.firstName} ${form.lastName}`.trim()} />
          <CoverImageUploader />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>First name</Label>
              <Input value={form.firstName} onChange={(e) => set("firstName", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Last name</Label>
              <Input value={form.lastName} onChange={(e) => set("lastName", e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Preferred name</Label>
            <Input value={form.preferredName} onChange={(e) => set("preferredName", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={form.email} disabled />
            </div>
            <div className="space-y-2">
              <Label>Mobile number</Label>
              <Input
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={form.phone}
                placeholder="+919876543210"
                onChange={(e) => set("phone", sanitizePhoneInput(e.target.value))}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Country</Label>
              <Select value={form.country} onChange={(v) => set("country", v)} options={asOptions(COUNTRY_OPTIONS)} />
            </div>
            <div className="space-y-2">
              <Label>City</Label>
              <Input value={form.city} onChange={(e) => set("city", e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Current Status</Label>
            <Select value={form.currentStatus} onChange={(v) => set("currentStatus", v)} options={CURRENT_STATUS_OPTIONS} />
          </div>
          <div className="space-y-2">
            <Label>Languages</Label>
            <CheckboxGroup options={LANGUAGE_OPTIONS} selected={form.languages} onChange={(v) => set("languages", v)} />
          </div>
          <div className="flex justify-end">
            <Button type="submit" variant="accent">Save &amp; continue</Button>
          </div>
        </form>
      )}

      {section === 1 && (
        <form onSubmit={save} className="space-y-4 rounded-xl border border-primary/8 bg-white p-6 shadow-card">
          <h3 className="font-semibold text-primary">Education &amp; Work</h3>
          <div className="space-y-2">
            <Label>Highest Qualification</Label>
            <Select value={form.highestQualification} onChange={(v) => set("highestQualification", v)}
              options={asOptions(QUALIFICATION_OPTIONS)} />
          </div>
          <div className="space-y-2">
            <Label>Current Institution / Organisation</Label>
            <Input value={form.currentInstitution} onChange={(e) => set("currentInstitution", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Current Course / Designation</Label>
            <Input value={form.currentDesignation} onChange={(e) => set("currentDesignation", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Years of Experience</Label>
              <Select value={form.yearsOfExperience} onChange={(v) => set("yearsOfExperience", v)}
                options={asOptions(YEARS_OF_EXPERIENCE_OPTIONS)} />
            </div>
            <div className="space-y-2">
              <Label>Preferred Industry</Label>
              <Select value={form.preferredIndustry} onChange={(v) => set("preferredIndustry", v)}
                options={asOptions(INDUSTRY_OPTIONS)} />
            </div>
          </div>
          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => setSection(0)}>
              <ChevronLeft className="mr-1 h-4 w-4" />Back
            </Button>
            <Button type="submit" variant="accent">Save &amp; continue</Button>
          </div>
        </form>
      )}

      {section === 2 && (
        <form onSubmit={save} className="space-y-4 rounded-xl border border-primary/8 bg-white p-6 shadow-card">
          <h3 className="font-semibold text-primary">Career Goals</h3>
          <div className="space-y-2">
            <Label>Career goal (next 3-5 years)</Label>
            <Textarea value={form.careerGoal} rows={3} onChange={(e) => set("careerGoal", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Areas where you seek guidance (up to 5)</Label>
            <CheckboxGroup options={GUIDANCE_OPTIONS} selected={form.guidanceAreas}
              onChange={(v) => set("guidanceAreas", v)} max={5} />
          </div>
          <div className="space-y-2">
            <Label>Skills you want to develop (comma-separated, up to 5)</Label>
            <Input value={form.skillsToDevelo} onChange={(e) => set("skillsToDevelo", e.target.value)} />
          </div>
          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => setSection(1)}>
              <ChevronLeft className="mr-1 h-4 w-4" />Back
            </Button>
            <Button type="submit" variant="accent">Save &amp; continue</Button>
          </div>
        </form>
      )}

      {section === 3 && (
        <form onSubmit={save} className="space-y-4 rounded-xl border border-primary/8 bg-white p-6 shadow-card">
          <h3 className="font-semibold text-primary">Mentoring Preferences</h3>
          <div className="space-y-2">
            <Label>Preferred mentor profile (comma-separated)</Label>
            <Input value={form.preferredMentorProfile}
              placeholder="Describe the kind of mentor you're looking for"
              onChange={(e) => set("preferredMentorProfile", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Preferred mentoring mode</Label>
            <CheckboxGroup options={MODE_OPTIONS} selected={form.preferredModes}
              onChange={(v) => set("preferredModes", v)} />
          </div>
          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => setSection(2)}>
              <ChevronLeft className="mr-1 h-4 w-4" />Back
            </Button>
            <Button type="submit" variant="accent">Save &amp; continue</Button>
          </div>
        </form>
      )}

      {section === 4 && (
        <form onSubmit={save} className="space-y-4 rounded-xl border border-primary/8 bg-white p-6 shadow-card">
          <h3 className="font-semibold text-primary">Personal</h3>
          <div className="space-y-2">
            <Label>Describe your biggest career challenge today</Label>
            <Textarea value={form.biggestChallenge} rows={4} onChange={(e) => set("biggestChallenge", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>What would make this mentorship a success for you after six months?</Label>
            <Textarea value={form.successDefinition} rows={4} onChange={(e) => set("successDefinition", e.target.value)} />
          </div>
          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => setSection(3)}>
              <ChevronLeft className="mr-1 h-4 w-4" />Back
            </Button>
            <Button type="submit" variant="accent">Save profile</Button>
          </div>
        </form>
      )}
    </div>
  );
}

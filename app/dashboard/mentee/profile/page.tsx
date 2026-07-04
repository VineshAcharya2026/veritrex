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

const SECTIONS = [
  "Basic Info",
  "Education & Work",
  "Career Goals",
  "Mentoring Preferences",
  "Personal",
] as const;

const GUIDANCE_OPTIONS = [
  "Career Confusion", "Interview Preparation", "Leadership", "Career Transition",
  "Job Search", "Personal Branding", "Start-ups", "Higher Studies",
  "Public Speaking", "Networking", "Salary Negotiation", "Workplace Conflicts",
];

const MODE_OPTIONS = ["VIDEO", "AUDIO", "CHAT", "GROUP", "ASYNC"];

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

type FormState = {
  currentRole: string;
  goals: string;
  desiredSkills: string;
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
  skillsToDevelo: string[];
  preferredMentorProfile: string;
  preferredModes: string[];
  languages: string;
  biggestChallenge: string;
  successDefinition: string;
};

const defaultForm: FormState = {
  currentRole: "", goals: "", desiredSkills: "", country: "", city: "",
  currentStatus: "", highestQualification: "", currentInstitution: "",
  currentDesignation: "", yearsOfExperience: "", preferredIndustry: "",
  careerGoal: "", guidanceAreas: [], skillsToDevelo: [],
  preferredMentorProfile: "", preferredModes: [], languages: "",
  biggestChallenge: "", successDefinition: "",
};

export default function MenteeProfilePage() {
  const [section, setSection] = useState(0);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/mentee/profile")
      .then((r) => r.json())
      .then((p) => {
        if (p?.id) {
          setForm({
            currentRole: p.currentRole || "",
            goals: p.goals || "",
            desiredSkills: (p.desiredSkills || []).join(", "),
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
            skillsToDevelo: p.skillsToDevelo || [],
            preferredMentorProfile: p.preferredMentorProfile || "",
            preferredModes: p.preferredModes || [],
            languages: (p.languages || []).join(", "),
            biggestChallenge: p.biggestChallenge || "",
            successDefinition: p.successDefinition || "",
          });
        }
      });
  }, []);

  async function save(e?: React.FormEvent) {
    e?.preventDefault();
    setError(""); setSaved(false);
    const res = await fetch("/api/mentee/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        currentStatus: form.currentStatus || null,
        languages: form.languages
          ? form.languages.split(",").map((s) => s.trim()).filter(Boolean)
          : undefined,
        skillsToDevelo: form.skillsToDevelo.length > 0
          ? form.skillsToDevelo
          : form.desiredSkills
            ? form.desiredSkills.split(",").map((s) => s.trim()).filter(Boolean)
            : [],
      }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to save");
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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Country</Label>
              <Input value={form.country} onChange={(e) => set("country", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>City</Label>
              <Input value={form.city} onChange={(e) => set("city", e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Current Status</Label>
            <select className="flex h-10 w-full rounded-sm border border-primary/15 bg-white px-3 text-sm"
              value={form.currentStatus} onChange={(e) => set("currentStatus", e.target.value)}>
              <option value="">Select</option>
              <option value="STUDENT">Student</option>
              <option value="GRADUATE">Graduate</option>
              <option value="PROFESSIONAL">Professional</option>
              <option value="ENTREPRENEUR">Entrepreneur</option>
              <option value="CAREER_BREAK">Career Break</option>
              <option value="CAREER_SWITCHER">Career Switcher</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Languages (comma-separated)</Label>
            <Input value={form.languages} onChange={(e) => set("languages", e.target.value)} />
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
            <select className="flex h-10 w-full rounded-sm border border-primary/15 bg-white px-3 text-sm"
              value={form.highestQualification} onChange={(e) => set("highestQualification", e.target.value)}>
              <option value="">Select</option>
              <option value="High School">High School</option>
              <option value="Diploma">Diploma</option>
              <option value="Bachelor's">Bachelor&apos;s</option>
              <option value="Master's">Master&apos;s</option>
              <option value="PhD">PhD</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Current Institution / Organisation</Label>
            <Input value={form.currentInstitution} onChange={(e) => set("currentInstitution", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Current Course / Designation</Label>
            <Input value={form.currentDesignation} onChange={(e) => set("currentDesignation", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Years of Experience</Label>
            <select className="flex h-10 w-full rounded-sm border border-primary/15 bg-white px-3 text-sm"
              value={form.yearsOfExperience} onChange={(e) => set("yearsOfExperience", e.target.value)}>
              <option value="">Select</option>
              <option value="Fresher">Fresher</option>
              <option value="0-2">0-2</option>
              <option value="3-5">3-5</option>
              <option value="6-10">6-10</option>
              <option value="10+">10+</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Preferred Industry</Label>
            <Input value={form.preferredIndustry} onChange={(e) => set("preferredIndustry", e.target.value)} />
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
            <Label>Areas where you seek guidance (max 5)</Label>
            <CheckboxGroup options={GUIDANCE_OPTIONS} selected={form.guidanceAreas}
              onChange={(v) => set("guidanceAreas", v)} max={5} />
          </div>
          <div className="space-y-2">
            <Label>Skills you want to develop (comma-separated, max 5)</Label>
            <Input value={form.desiredSkills} onChange={(e) => set("desiredSkills", e.target.value)} />
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
            <Label>Preferred mentor profile</Label>
            <Textarea value={form.preferredMentorProfile} rows={3}
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

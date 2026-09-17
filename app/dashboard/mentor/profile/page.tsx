"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Linkedin, Trash2, Upload, ChevronLeft, ChevronRight } from "lucide-react";
import { CoverImageUploader } from "@/components/profile/CoverImageUploader";
import { AvatarImageUploader } from "@/components/profile/AvatarImageUploader";

type Skill = { skill: string; masteryLevel: number };
type ContentItem = {
  id: string;
  type: string;
  title: string;
  description: string | null;
  fileUrl: string;
  publishedAt: string;
};

const SECTIONS = [
  "Professional Identity",
  "My Expertise",
  "My Mentoring Philosophy",
  "My Mentoring Style",
  "Professional Achievements",
  "Personal Side",
  "Availability",
  "Public Closing",
] as const;

const EXPERTISE_OPTIONS = [
  "Leadership", "Software Engineering", "Artificial Intelligence", "Marketing",
  "Finance", "HR", "Entrepreneurship", "Education", "Healthcare", "Legal",
  "Operations", "Sales", "Product Management", "Cybersecurity", "Data Science",
];

const MENTEE_TYPE_OPTIONS = [
  "Students", "Fresh Graduates", "Women Professionals", "Founders",
  "Mid-Career Professionals", "Career Switchers", "First-generation Professionals",
  "Researchers", "Executives",
];

const CHALLENGE_OPTIONS = [
  "Career Confusion", "Interview Preparation", "Leadership", "Career Transition",
  "Job Search", "Personal Branding", "Start-ups", "Higher Studies",
  "Public Speaking", "Networking", "Salary Negotiation", "Workplace Conflicts",
];

const STYLE_OPTIONS = [
  "Coach", "Teacher", "Thought Partner", "Strategic Advisor",
  "Problem Solver", "Accountability Partner",
];

const INTEREST_OPTIONS = [
  "Reading", "Travel", "Sports", "Music", "Teaching", "Writing",
  "Volunteering", "Photography", "Fitness", "Meditation",
];

const CONTENT_TYPES = ["POST", "PODCAST", "VIDEO", "IMAGE"] as const;

function formatApiError(error: unknown, fallback: string) {
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "formErrors" in error) {
    const f = error as {
      formErrors?: string[];
      fieldErrors?: Record<string, string[]>;
    };
    const parts = [
      ...(f.formErrors ?? []),
      ...Object.entries(f.fieldErrors ?? {}).flatMap(([k, v]) =>
        (v ?? []).map((m) => `${k}: ${m}`)
      ),
    ];
    if (parts.length) return parts.join("; ");
  }
  return fallback;
}

type FormState = {
  company: string;
  title: string;
  expertise: string;
  yearsExp: string;
  maxMentees: string;
  linkedInUrl: string;
  city: string;
  industry: string;
  seniorityLevel: string;
  interests: string;
  offersFreeMentorship: boolean;
  professionalHeadline: string;
  professionalSummary: string;
  threeWords: string[];
  areasOfExpertise: string[];
  industriesWorked: string;
  yearsOfExperienceRange: string;
  whyMentor: string;
  preferredMenteeTypes: string[];
  challengesCanHelp: string[];
  mentoringStyle: string[];
  sessionExpectations: string;
  menteeExpectations: string;
  achievements: string;
  certifications: string;
  personalInterests: string[];
  influentialQuote: string;
  preferredFormats: string[];
  languages: string;
  completeSentence: string;
  welcomeMessage: string;
};

const defaultForm: FormState = {
  company: "", title: "", expertise: "", yearsExp: "", maxMentees: "5",
  linkedInUrl: "", city: "", industry: "", seniorityLevel: "", interests: "",
  offersFreeMentorship: false, professionalHeadline: "", professionalSummary: "",
  threeWords: ["", "", ""], areasOfExpertise: [], industriesWorked: "",
  yearsOfExperienceRange: "", whyMentor: "", preferredMenteeTypes: [],
  challengesCanHelp: [], mentoringStyle: [], sessionExpectations: "",
  menteeExpectations: "", achievements: "", certifications: "",
  personalInterests: [], influentialQuote: "", preferredFormats: [],
  languages: "", completeSentence: "", welcomeMessage: "",
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
              if (active) {
                onChange(selected.filter((s) => s !== opt));
              } else if (!max || selected.length < max) {
                onChange([...selected, opt]);
              }
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

export default function MentorProfilePage() {
  const [section, setSection] = useState(0);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [newSkill, setNewSkill] = useState({ skill: "", masteryLevel: "3" });
  const [content, setContent] = useState<ContentItem[]>([]);
  const [contentForm, setContentForm] = useState({
    type: "POST" as (typeof CONTENT_TYPES)[number],
    title: "", description: "", file: null as File | null,
  });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  function loadProfile() {
    fetch("/api/mentor/profile")
      .then((r) => r.json())
      .then((p) => {
        if (p?.id) {
          setForm({
            company: p.company || "",
            title: p.title || "",
            expertise: (p.expertise || []).join(", "),
            yearsExp: p.yearsExp?.toString() || "",
            maxMentees: p.maxMentees?.toString() || "5",
            linkedInUrl: p.linkedInUrl || "",
            city: p.city || "",
            industry: p.industry || "",
            seniorityLevel: p.seniorityLevel || "",
            interests: (p.interests || []).join(", "),
            offersFreeMentorship: p.offersFreeMentorship ?? false,
            professionalHeadline: p.professionalHeadline || "",
            professionalSummary: p.professionalSummary || "",
            threeWords: p.threeWords?.length ? p.threeWords : ["", "", ""],
            areasOfExpertise: p.areasOfExpertise || [],
            industriesWorked: (p.industriesWorked || []).join(", "),
            yearsOfExperienceRange: p.yearsOfExperienceRange || "",
            whyMentor: p.whyMentor || "",
            preferredMenteeTypes: p.preferredMenteeTypes || [],
            challengesCanHelp: p.challengesCanHelp || [],
            mentoringStyle: p.mentoringStyle || [],
            sessionExpectations: p.sessionExpectations || "",
            menteeExpectations: p.menteeExpectations || "",
            achievements: p.achievements || "",
            certifications: p.certifications || "",
            personalInterests: p.personalInterests || [],
            influentialQuote: p.influentialQuote || "",
            preferredFormats: p.preferredFormats || [],
            languages: (p.languages || []).join(", "),
            completeSentence: p.completeSentence || "",
            welcomeMessage: p.welcomeMessage || "",
          });
          setSkills(p.skills || []);
        }
      });
  }

  function loadContent() {
    fetch("/api/mentor/content")
      .then((r) => r.json())
      .then((items) => { if (Array.isArray(items)) setContent(items); });
  }

  useEffect(() => { loadProfile(); loadContent(); }, []);

  async function saveProfile(
    e?: React.FormEvent,
    options?: { advance?: boolean }
  ) {
    e?.preventDefault();
    setError("");
    setSaved(false);
    setSaving(true);
    try {
      const res = await fetch("/api/mentor/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          yearsExp: form.yearsExp ? Number(form.yearsExp) : undefined,
          maxMentees: Number(form.maxMentees) || 5,
          seniorityLevel: form.seniorityLevel || null,
          linkedInUrl: form.linkedInUrl.trim(),
          skills,
          threeWords: form.threeWords.filter(Boolean),
          industriesWorked: form.industriesWorked
            ? form.industriesWorked.split(",").map((s) => s.trim()).filter(Boolean)
            : undefined,
          languages: form.languages
            ? form.languages.split(",").map((s) => s.trim()).filter(Boolean)
            : undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(formatApiError(data.error, "Failed to save"));
        return;
      }
      setSaved(true);
      loadProfile();
      if (options?.advance) {
        setSection((s) => Math.min(s + 1, SECTIONS.length - 1));
        if (typeof window !== "undefined") {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }
    } catch {
      setError("Network error — could not save profile");
    } finally {
      setSaving(false);
    }
  }

  function addSkill() {
    if (!newSkill.skill.trim()) return;
    setSkills([
      ...skills.filter((s) => s.skill.toLowerCase() !== newSkill.skill.toLowerCase()),
      { skill: newSkill.skill.trim(), masteryLevel: Number(newSkill.masteryLevel) },
    ]);
    setNewSkill({ skill: "", masteryLevel: "3" });
  }

  async function publishContent(e: React.FormEvent) {
    e.preventDefault();
    if (!contentForm.file || !contentForm.title) { setError("Title and file are required"); return; }
    setUploading(true); setError("");
    const fd = new FormData();
    fd.append("file", contentForm.file);
    const uploadRes = await fetch("/api/mentor/upload", { method: "POST", body: fd });
    const uploadData = await uploadRes.json();
    if (!uploadRes.ok) { setError(uploadData.error || "Upload failed"); setUploading(false); return; }
    const res = await fetch("/api/mentor/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: contentForm.type, title: contentForm.title,
        description: contentForm.description || undefined,
        fileUrl: uploadData.fileUrl, storageKey: uploadData.storageKey,
        mimeType: uploadData.mimeType, fileSize: uploadData.fileSize,
      }),
    });
    setUploading(false);
    if (!res.ok) { const data = await res.json(); setError(data.error || "Failed to publish"); return; }
    setContentForm({ type: "POST", title: "", description: "", file: null });
    loadContent(); setSaved(true);
  }

  async function deleteContent(id: string) {
    await fetch(`/api/mentor/content/${id}`, { method: "DELETE" });
    loadContent();
  }

  const set = (key: keyof FormState, val: FormState[keyof FormState]) =>
    setForm((f) => ({ ...f, [key]: val }));

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Mentor profile"
        description="Build your public profile to attract the right mentees."
      />

      {saved && <Alert variant="success">Saved successfully.</Alert>}
      {error && <Alert variant="error">{error}</Alert>}

      {/* Section navigation */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-primary/10 pb-2">
        {SECTIONS.map((s, i) => (
          <button
            key={s}
            type="button"
            onClick={() => setSection(i)}
            className={cn(
              "whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
              section === i ? "bg-accent text-white" : "text-muted hover:bg-primary/5"
            )}
          >
            {i + 1}. {s}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setSection(8)}
          className={cn(
            "whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
            section === 8 ? "bg-accent text-white" : "text-muted hover:bg-primary/5"
          )}
        >
          Content
        </button>
      </div>

      {/* Section 1: Professional Identity */}
      {section === 0 && (
        <form onSubmit={(e) => saveProfile(e, { advance: true })} className="space-y-4 rounded-xl border border-primary/8 bg-white p-6 shadow-card">
          <h3 className="font-semibold text-primary">Professional Identity</h3>
          <AvatarImageUploader displayName={form.professionalHeadline || form.company || undefined} />
          <CoverImageUploader />
          <div className="space-y-2">
            <Label>Professional Headline (max 120 chars)</Label>
            <Input value={form.professionalHeadline} maxLength={120}
              placeholder="e.g. Former Google Engineering Leader | Helping Young Professionals Build Careers in AI"
              onChange={(e) => set("professionalHeadline", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Professional Summary (250 words)</Label>
            <Textarea value={form.professionalSummary} rows={5}
              placeholder="Tell prospective mentees about your professional journey. What are you most proud of?"
              onChange={(e) => set("professionalSummary", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Three words that best describe you</Label>
            <div className="grid grid-cols-3 gap-2">
              {[0, 1, 2].map((i) => (
                <Input key={i} placeholder={["e.g. Curious", "e.g. Practical", "e.g. Empathetic"][i]}
                  value={form.threeWords[i] || ""}
                  onChange={(e) => {
                    const words = [...form.threeWords];
                    words[i] = e.target.value;
                    set("threeWords", words);
                  }} />
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Company</Label>
              <Input value={form.company} onChange={(e) => set("company", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Current role / title</Label>
              <Input value={form.title} onChange={(e) => set("title", e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>LinkedIn profile URL</Label>
            <Input value={form.linkedInUrl} placeholder="https://linkedin.com/in/yourprofile"
              onChange={(e) => set("linkedInUrl", e.target.value)} />
          </div>
          <div className="flex justify-between">
            <div />
            <Button type="submit" variant="accent" disabled={saving}>
              {saving ? "Saving…" : "Save & continue"}
            </Button>
          </div>
        </form>
      )}

      {/* Section 2: My Expertise */}
      {section === 1 && (
        <form onSubmit={(e) => saveProfile(e, { advance: true })} className="space-y-4 rounded-xl border border-primary/8 bg-white p-6 shadow-card">
          <h3 className="font-semibold text-primary">My Expertise</h3>
          <div className="space-y-2">
            <Label>Areas of expertise (max 5)</Label>
            <CheckboxGroup options={EXPERTISE_OPTIONS} selected={form.areasOfExpertise}
              onChange={(v) => set("areasOfExpertise", v)} max={5} />
          </div>
          <div className="space-y-2">
            <Label>Industries you have worked in (comma-separated)</Label>
            <Input value={form.industriesWorked}
              onChange={(e) => set("industriesWorked", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Years of experience</Label>
            <select className="flex h-10 w-full rounded-sm border border-primary/15 bg-white px-3 text-sm"
              value={form.yearsOfExperienceRange}
              onChange={(e) => set("yearsOfExperienceRange", e.target.value)}>
              <option value="">Select</option>
              <option value="0-5">0-5</option>
              <option value="6-10">6-10</option>
              <option value="11-20">11-20</option>
              <option value="20+">20+</option>
            </select>
          </div>
          <div className="space-y-3 border-t border-primary/8 pt-4">
            <Label>Skills &amp; mastery (1-5)</Label>
            <div className="flex gap-2">
              <Input placeholder="Skill name" value={newSkill.skill}
                onChange={(e) => setNewSkill({ ...newSkill, skill: e.target.value })} />
              <select className="rounded-sm border border-primary/15 px-2 text-sm"
                value={newSkill.masteryLevel}
                onChange={(e) => setNewSkill({ ...newSkill, masteryLevel: e.target.value })}>
                {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
              <Button type="button" variant="outline" onClick={addSkill}>Add</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {skills.map((s) => (
                <Badge key={s.skill} className="gap-1">
                  {s.skill} ({s.masteryLevel}/5)
                  <button type="button" onClick={() => setSkills(skills.filter((x) => x.skill !== s.skill))}>x</button>
                </Badge>
              ))}
            </div>
          </div>
          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => setSection(0)}>
              <ChevronLeft className="mr-1 h-4 w-4" />Back
            </Button>
            <Button type="submit" variant="accent" disabled={saving}>
              {saving ? "Saving…" : "Save & continue"}
            </Button>
          </div>
        </form>
      )}

      {/* Section 3: My Mentoring Philosophy */}
      {section === 2 && (
        <form onSubmit={(e) => saveProfile(e, { advance: true })} className="space-y-4 rounded-xl border border-primary/8 bg-white p-6 shadow-card">
          <h3 className="font-semibold text-primary">My Mentoring Philosophy</h3>
          <div className="space-y-2">
            <Label>Why do you mentor?</Label>
            <Textarea value={form.whyMentor} rows={4}
              placeholder="What inspires you to invest your time in helping others?"
              onChange={(e) => set("whyMentor", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>What type of mentees do you enjoy working with?</Label>
            <CheckboxGroup options={MENTEE_TYPE_OPTIONS} selected={form.preferredMenteeTypes}
              onChange={(v) => set("preferredMenteeTypes", v)} />
          </div>
          <div className="space-y-2">
            <Label>What challenges can you help mentees overcome?</Label>
            <CheckboxGroup options={CHALLENGE_OPTIONS} selected={form.challengesCanHelp}
              onChange={(v) => set("challengesCanHelp", v)} />
          </div>
          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => setSection(1)}>
              <ChevronLeft className="mr-1 h-4 w-4" />Back
            </Button>
            <Button type="submit" variant="accent" disabled={saving}>
              {saving ? "Saving…" : "Save & continue"}
            </Button>
          </div>
        </form>
      )}

      {/* Section 4: My Mentoring Style */}
      {section === 3 && (
        <form onSubmit={(e) => saveProfile(e, { advance: true })} className="space-y-4 rounded-xl border border-primary/8 bg-white p-6 shadow-card">
          <h3 className="font-semibold text-primary">My Mentoring Style</h3>
          <div className="space-y-2">
            <Label>How would you describe your mentoring style? (choose up to 2)</Label>
            <CheckboxGroup options={STYLE_OPTIONS} selected={form.mentoringStyle}
              onChange={(v) => set("mentoringStyle", v)} max={2} />
          </div>
          <div className="space-y-2">
            <Label>What should a mentee expect from your sessions?</Label>
            <Textarea value={form.sessionExpectations} rows={4}
              onChange={(e) => set("sessionExpectations", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>What do you expect from your mentees?</Label>
            <Textarea value={form.menteeExpectations} rows={4}
              onChange={(e) => set("menteeExpectations", e.target.value)} />
          </div>
          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => setSection(2)}>
              <ChevronLeft className="mr-1 h-4 w-4" />Back
            </Button>
            <Button type="submit" variant="accent" disabled={saving}>
              {saving ? "Saving…" : "Save & continue"}
            </Button>
          </div>
        </form>
      )}

      {/* Section 5: Professional Achievements */}
      {section === 4 && (
        <form onSubmit={(e) => saveProfile(e, { advance: true })} className="space-y-4 rounded-xl border border-primary/8 bg-white p-6 shadow-card">
          <h3 className="font-semibold text-primary">Professional Achievements</h3>
          <div className="space-y-2">
            <Label>Three professional achievements you are proud of</Label>
            <Textarea value={form.achievements} rows={5}
              onChange={(e) => set("achievements", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Certifications, awards or recognitions</Label>
            <Input value={form.certifications}
              onChange={(e) => set("certifications", e.target.value)} />
          </div>
          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => setSection(3)}>
              <ChevronLeft className="mr-1 h-4 w-4" />Back
            </Button>
            <Button type="submit" variant="accent" disabled={saving}>
              {saving ? "Saving…" : "Save & continue"}
            </Button>
          </div>
        </form>
      )}

      {/* Section 6: Personal Side */}
      {section === 5 && (
        <form onSubmit={(e) => saveProfile(e, { advance: true })} className="space-y-4 rounded-xl border border-primary/8 bg-white p-6 shadow-card">
          <h3 className="font-semibold text-primary">Personal Side</h3>
          <div className="space-y-2">
            <Label>Outside work, what are your interests?</Label>
            <CheckboxGroup options={INTEREST_OPTIONS} selected={form.personalInterests}
              onChange={(v) => set("personalInterests", v)} />
          </div>
          <div className="space-y-2">
            <Label>A book, quote or life lesson that has influenced you</Label>
            <Textarea value={form.influentialQuote} rows={3}
              onChange={(e) => set("influentialQuote", e.target.value)} />
          </div>
          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => setSection(4)}>
              <ChevronLeft className="mr-1 h-4 w-4" />Back
            </Button>
            <Button type="submit" variant="accent" disabled={saving}>
              {saving ? "Saving…" : "Save & continue"}
            </Button>
          </div>
        </form>
      )}

      {/* Section 7: Availability */}
      {section === 6 && (
        <form onSubmit={(e) => saveProfile(e, { advance: true })} className="space-y-4 rounded-xl border border-primary/8 bg-white p-6 shadow-card">
          <h3 className="font-semibold text-primary">Availability</h3>
          <div className="space-y-2">
            <Label>Preferred mentoring format</Label>
            <CheckboxGroup
              options={["VIDEO", "AUDIO", "CHAT", "GROUP", "ASYNC"]}
              selected={form.preferredFormats}
              onChange={(v) => set("preferredFormats", v)}
            />
          </div>
          <div className="space-y-2">
            <Label>Languages (comma-separated)</Label>
            <Input value={form.languages}
              onChange={(e) => set("languages", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>City</Label>
              <Input value={form.city} onChange={(e) => set("city", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Industry</Label>
              <Input value={form.industry} onChange={(e) => set("industry", e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Max mentees</Label>
            <Input type="number" value={form.maxMentees}
              onChange={(e) => set("maxMentees", e.target.value)} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="accent-accent"
              checked={form.offersFreeMentorship}
              onChange={(e) => set("offersFreeMentorship", e.target.checked)} />
            I offer free or concessional mentorship (nation building)
          </label>
          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => setSection(5)}>
              <ChevronLeft className="mr-1 h-4 w-4" />Back
            </Button>
            <Button type="submit" variant="accent" disabled={saving}>
              {saving ? "Saving…" : "Save & continue"}
            </Button>
          </div>
        </form>
      )}

      {/* Section 8: Public Closing */}
      {section === 7 && (
        <form onSubmit={(e) => saveProfile(e, { advance: false })} className="space-y-4 rounded-xl border border-primary/8 bg-white p-6 shadow-card">
          <h3 className="font-semibold text-primary">Public Closing</h3>
          <div className="space-y-2">
            <Label>Complete this sentence: &quot;If I could help every mentee achieve just one thing, it would be...&quot;</Label>
            <Textarea value={form.completeSentence} rows={3}
              onChange={(e) => set("completeSentence", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Message to prospective mentees</Label>
            <Textarea value={form.welcomeMessage} rows={4}
              placeholder="Write a short welcome message that every mentee visiting your profile will read."
              onChange={(e) => set("welcomeMessage", e.target.value)} />
          </div>
          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => setSection(6)}>
              <ChevronLeft className="mr-1 h-4 w-4" />Back
            </Button>
            <Button type="submit" variant="accent" disabled={saving}>
              {saving ? "Saving…" : "Save profile"}
            </Button>
          </div>
        </form>
      )}

      {/* Content tab */}
      {section === 8 && (
        <div className="space-y-6">
          <form onSubmit={publishContent} className="space-y-4 rounded-xl border border-primary/8 bg-white p-6 shadow-card">
            <h3 className="font-semibold text-primary">Publish Content</h3>
            <div className="space-y-2">
              <Label>Content type</Label>
              <select className="flex h-10 w-full rounded-sm border border-primary/15 bg-white px-3 text-sm"
                value={contentForm.type}
                onChange={(e) => setContentForm({ ...contentForm, type: e.target.value as (typeof CONTENT_TYPES)[number] })}>
                {CONTENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={contentForm.title}
                onChange={(e) => setContentForm({ ...contentForm, title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={contentForm.description} rows={2}
                onChange={(e) => setContentForm({ ...contentForm, description: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Upload file</Label>
              <Input type="file" accept="image/*,video/*,audio/*"
                onChange={(e) => setContentForm({ ...contentForm, file: e.target.files?.[0] ?? null })} />
            </div>
            <Button type="submit" variant="accent" disabled={uploading} className="gap-2">
              <Upload className="h-4 w-4" />{uploading ? "Uploading..." : "Publish content"}
            </Button>
          </form>
          <div className="space-y-3">
            {content.map((item) => (
              <div key={item.id} className="flex items-start justify-between rounded-xl border border-primary/8 bg-white p-4 shadow-card">
                <div>
                  <Badge>{item.type}</Badge>
                  <p className="mt-1 font-medium text-primary">{item.title}</p>
                  {item.description && <p className="text-sm text-muted">{item.description}</p>}
                  <a href={item.fileUrl} target="_blank" rel="noopener noreferrer" className="mt-1 text-xs text-accent hover:underline">View file</a>
                </div>
                <Button variant="outline" size="sm" onClick={() => deleteContent(item.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

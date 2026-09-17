export type MentorFilterParams = {
  q?: string;
  company?: string[];
  skills?: string[];
  excludeUserId?: string;
};

export function parseListParam(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function parseMentorFilters(searchParams: URLSearchParams): MentorFilterParams {
  return {
    q: searchParams.get("q")?.trim() || undefined,
    company: parseListParam(searchParams.get("company")),
    skills: parseListParam(searchParams.get("skills")),
  };
}

export function buildMentorWhere(filters: MentorFilterParams): Record<string, unknown> {
  const and: Record<string, unknown>[] = [{ role: "MENTOR", status: "ACTIVE" }];

  if (filters.excludeUserId) {
    and.push({ id: { not: filters.excludeUserId } });
  }

  if (filters.q) {
    and.push({
      OR: [
        { email: { contains: filters.q, mode: "insensitive" } },
        { profile: { firstName: { contains: filters.q, mode: "insensitive" } } },
        { profile: { lastName: { contains: filters.q, mode: "insensitive" } } },
        { mentorProfile: { company: { contains: filters.q, mode: "insensitive" } } },
        { mentorProfile: { title: { contains: filters.q, mode: "insensitive" } } },
      ],
    });
  }

  if (filters.company?.length) {
    and.push({
      OR: filters.company.map((c) => ({
        mentorProfile: { company: { equals: c, mode: "insensitive" } },
      })),
    });
  }

  if (filters.skills?.length) {
    and.push({
      mentorProfile: {
        expertise: { hasSome: filters.skills },
      },
    });
  }

  return { AND: and };
}

export function filtersToQueryString(filters: Record<string, string | string[] | number | undefined>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === "" || (Array.isArray(value) && value.length === 0)) continue;
    if (Array.isArray(value)) params.set(key, value.join(","));
    else params.set(key, String(value));
  }
  const s = params.toString();
  return s ? `?${s}` : "";
}

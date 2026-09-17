import { prisma } from "@/lib/prisma";
import { BRAND } from "@/lib/brand";

const DEFAULTS: Record<string, string> = {
  default_max_mentees: "5",
  free_mentorship_hours_cap: String(BRAND.freeMentorshipHoursCap),
};

export async function getConfig(key: string): Promise<string> {
  const row = await prisma.platformConfig.findUnique({ where: { key } });
  return row?.value ?? DEFAULTS[key] ?? "";
}

export async function getAllConfig(): Promise<Record<string, string>> {
  const rows = await prisma.platformConfig.findMany();
  const map = { ...DEFAULTS };
  for (const row of rows) map[row.key] = row.value;
  return map;
}

export async function getFreeMentorshipHoursCap(): Promise<number> {
  const raw = await getConfig("free_mentorship_hours_cap");
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : BRAND.freeMentorshipHoursCap;
}

export async function getFreeMentorshipMinutesCap(): Promise<number> {
  return (await getFreeMentorshipHoursCap()) * 60;
}

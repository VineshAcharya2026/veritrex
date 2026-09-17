import type { Role } from "@/lib/db/types";

export function dashboardPathForRole(role: Role): string {
  switch (role) {
    case "SUPER_ADMIN":
      return "/dashboard/admin";
    case "MENTOR":
    case "MENTEE":
      return "/dashboard/feed";
    default:
      return "/";
  }
}

import {
  LayoutDashboard,
  Users,
  ShieldBan,
  Settings,
  ClipboardList,
  LogIn,
  UserCircle,
  GraduationCap,
  Target,
  HeartHandshake,
  UserPlus,
  Globe,
  Crown,
  CheckCircle,
  AlertTriangle,
  Flag,
  Star,
  Home,
} from "lucide-react";
import type { NavItem } from "@/components/layout/Sidebar";

export const superAdminNav: NavItem[] = [
  { href: "/dashboard/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/admin/users", label: "Users", icon: Users },
  { href: "/dashboard/admin/mentorships", label: "Mentorships", icon: GraduationCap },
  { href: "/dashboard/admin/ratings", label: "Ratings & Trust", icon: Star },
  { href: "/dashboard/admin/inner-circle", label: "Inner Circle", icon: Crown },
  { href: "/dashboard/admin/outcomes", label: "Impact Score", icon: CheckCircle },
  { href: "/dashboard/admin/cheat-flags", label: "Cheat Flags", icon: Flag },
  { href: "/dashboard/admin/strikes", label: "Strikes", icon: AlertTriangle },
  { href: "/dashboard/admin/logins", label: "Logins", icon: LogIn },
  { href: "/dashboard/admin/blacklist", label: "Blacklist", icon: ShieldBan },
  { href: "/dashboard/admin/config", label: "Config", icon: Settings },
  { href: "/dashboard/admin/audit", label: "Audit Log", icon: ClipboardList },
];

export const mentorNav: NavItem[] = [
  { href: "/dashboard/feed", label: "Home", icon: Home },
  { href: "/dashboard/mentor", label: "Workspace", icon: LayoutDashboard },
  { href: "/dashboard/mentor/ratings", label: "Ratings & Trust", icon: Star },
  { href: "/dashboard/mentor/mentees", label: "Mentees", icon: Users },
  { href: "/dashboard/mentor/profile", label: "Profile", icon: UserCircle },
  { href: "/dashboard/friends", label: "Find Friends", icon: UserPlus },
  { href: "/dashboard/mentor/nation-building", label: "Impact Score", icon: Globe },
  { href: "/dashboard/mentor/inner-circle", label: "Inner Circle", icon: Crown },
  { href: "/dashboard/mentor/reflection", label: "Reflection", icon: HeartHandshake },
];

export const menteeNav: NavItem[] = [
  { href: "/dashboard/feed", label: "Home", icon: Home },
  { href: "/dashboard/mentee", label: "Workspace", icon: LayoutDashboard },
  { href: "/dashboard/mentee/ratings", label: "Ratings & Trust", icon: Star },
  { href: "/dashboard/mentee/mentors", label: "Find Mentors", icon: GraduationCap },
  { href: "/dashboard/mentee/mentorships", label: "My Mentorships", icon: Users },
  { href: "/dashboard/mentee/profile", label: "Profile", icon: UserCircle },
  { href: "/dashboard/friends", label: "Find Friends", icon: UserPlus },
  { href: "/dashboard/mentee/goals", label: "Goals", icon: Target },
  { href: "/dashboard/mentee/reflection", label: "Reflection", icon: HeartHandshake },
];

export const adminNav = superAdminNav;

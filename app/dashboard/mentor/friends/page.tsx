import { redirect } from "next/navigation";

export default function MentorFriendsRedirect() {
  redirect("/dashboard/friends");
}

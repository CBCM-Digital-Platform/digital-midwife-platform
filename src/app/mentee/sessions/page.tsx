import { getUpcomingSessions } from "@/services/mentee.service";
import type { MenteeSessionItem } from "@/services/mentee.service";
import { MenteeSessionsView } from "@/components/MenteeLearning/MenteeSessionsView";

export const metadata = {
  title: "My Sessions | Digital Midwife Mentorship Platform",
  description: "View and join your scheduled mentoring sessions.",
};

export default async function MenteeSessionsPage() {
  let sessions: MenteeSessionItem[] = [];
  let loadError: string | null = null;
  try {
    sessions = await getUpcomingSessions();
  } catch (error) {
    console.error("Could not load mentee sessions:", error);
    loadError = "Unable to load sessions from the backend. Please try again later.";
  }

  return <MenteeSessionsView sessions={sessions} loadError={loadError} />;
}

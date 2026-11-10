import { getSessions } from "@/services/sessions.service";
import { getMyMentees } from "@/services/my-mentees.service";
import { SessionsView } from "@/components/Sessions/SessionsView";
import type { ClinicalSession } from "@/types/clinical-session";
import type { MyMentee } from "@/types/my-mentee";

export const metadata = {
    title: "Clinical Sessions | Digital Midwife Mentorship Platform",
    description: "Manage, observe, and document clinical preceptor encounters with assigned midwives.",
};

export default async function SessionsPage() {
    let sessions: ClinicalSession[] = [];
    let loadError: string | null = null;
    let mentees: MyMentee[] = [];
    try {
        mentees = await getMyMentees();
    } catch (error) {
        console.error("Could not load mentor's assigned mentees:", error);
        loadError = "Unable to load your assigned mentees from the backend.";
    }
    try {
        sessions = await getSessions();
        const menteeNames = new Map(
            mentees.map((mentee) => [mentee.id, mentee.name])
        );
        sessions = sessions.map((session) => ({
            ...session,
            menteeName:
                menteeNames.get(String(session.menteeId)) || session.menteeName,
        }));
    } catch (error) {
        console.error("Could not load clinical sessions:", error);
        loadError = [
            loadError,
            "Unable to load sessions from the backend. Check your connection and try again.",
        ].filter(Boolean).join(" ");
    }

    return (
        <SessionsView
            initialSessions={sessions}
            mentees={mentees}
            loadError={loadError}
        />
    );
}

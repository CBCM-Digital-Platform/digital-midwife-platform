import { getSessions } from "@/services/sessions.service";
import { getMyMentees } from "@/services/my-mentees.service";
import { SessionsView } from "@/components/Sessions/SessionsView";

export const metadata = {
    title: "Clinical Sessions | Digital Midwife Mentorship Platform",
    description: "Manage, observe, and document clinical preceptor encounters with assigned midwives.",
};

export default async function SessionsPage() {
    const [sessions, mentees] = await Promise.all([
        getSessions(),
        getMyMentees(),
    ]);

    return <SessionsView initialSessions={sessions} mentees={mentees} />;
}

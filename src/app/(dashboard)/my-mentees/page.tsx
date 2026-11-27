import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { MyMenteesView } from "@/components/MyMentees/MyMenteesView";
import { getMyMentees } from "@/services/my-mentees.service";
import type { MyMentee } from "@/types/my-mentee";

export default async function MyMenteesPreviewPage() {
    const session = await getServerSession(authOptions);
    const mentorId = (session?.user as { id?: string | number } | undefined)?.id;
    let mentees: MyMentee[] = [];
    let loadError: string | null = null;
    try {
        mentees = await getMyMentees(mentorId);
    } catch (error) {
        console.error("Could not load the mentor's assigned mentees:", error);
        loadError =
            "We could not reach the backend to load your mentees. Check your connection and try again.";
    }
    return <MyMenteesView mentees={mentees} loadError={loadError} />;
}

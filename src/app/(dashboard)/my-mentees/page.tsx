import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { MyMenteesView } from "@/components/MyMentees/MyMenteesView";
import { getMyMentees } from "@/services/my-mentees.service";

export default async function MyMenteesPreviewPage() {
    const session = await getServerSession(authOptions);
    const mentorId = (session?.user as { id?: string } | undefined)?.id;
    let mentees: Awaited<ReturnType<typeof getMyMentees>> = [];
    let loadError: string | null = null;
    try {
        mentees = await getMyMentees(mentorId);
    } catch (error) {
        loadError =
            error instanceof Error ? error.message : "Unable to load mentees from the backend.";
    }
    return <MyMenteesView mentees={mentees} loadError={loadError} />;
}

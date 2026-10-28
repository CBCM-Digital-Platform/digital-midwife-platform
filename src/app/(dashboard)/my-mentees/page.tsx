import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { MyMenteesView } from "@/components/MyMentees/MyMenteesView";
import { getMyMentees } from "@/services/my-mentees.service";

export default async function MyMenteesPreviewPage() {
    const session = await getServerSession(authOptions);
    const mentorId = (session?.user as any)?.id;
    const mentees = await getMyMentees(mentorId);
    return <MyMenteesView mentees={mentees} />;
}

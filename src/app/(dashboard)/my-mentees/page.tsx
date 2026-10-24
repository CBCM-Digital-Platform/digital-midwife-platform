import { MyMenteesView } from "@/components/MyMentees/MyMenteesView";
import { getMyMentees } from "@/services/my-mentees.service";

export default async function MyMenteesPreviewPage() {
    const mentees = await getMyMentees();
    return <MyMenteesView mentees={mentees} />;
}

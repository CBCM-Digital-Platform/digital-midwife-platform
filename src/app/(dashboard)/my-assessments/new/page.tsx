import { NewAssessmentForm } from "@/components/MentorAssessments/NewAssessmentForm";
import { getAssessmentTypes } from "@/services/mentor-assessments.service";
import { getMyMentees } from "@/services/my-mentees.service";

export default async function NewMyAssessmentPage({
    searchParams,
}: {
    searchParams: Promise<{ menteeId?: string }>;
}) {
    const { menteeId } = await searchParams;
    const [mentees, types] = await Promise.all([getMyMentees(), getAssessmentTypes()]);

    return <NewAssessmentForm mentees={mentees} types={types} initialMenteeId={menteeId} />;
}
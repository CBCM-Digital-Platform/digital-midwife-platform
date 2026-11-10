import { NewAssessmentForm } from "@/components/MentorAssessments/NewAssessmentForm";
import { getAssessmentTypes } from "@/services/mentor-assessments.service";
import { getMyMentees } from "@/services/my-mentees.service";
import type { AssessmentTypeOption } from "@/types/mentor-assessment";
import type { MyMentee } from "@/types/my-mentee";

export default async function NewMyAssessmentPage({
    searchParams,
}: {
    searchParams: Promise<{ menteeId?: string }>;
}) {
    const { menteeId } = await searchParams;
    let mentees: MyMentee[] = [];
    let types: AssessmentTypeOption[] = [];
    let loadError: string | null = null;
    try {
        mentees = await getMyMentees();
    } catch (error) {
        console.error("Could not load mentor's assigned mentees:", error);
        loadError = error instanceof Error
            ? error.message
            : "Unable to load your assigned mentees from the backend.";
    }
    try {
        types = await getAssessmentTypes();
    } catch (error) {
        console.error("Could not load assessment thematic areas:", error);
        loadError = [
            loadError,
            "Unable to load thematic areas from the backend. Please try again later.",
        ].filter(Boolean).join(" ");
    }

    return (
        <NewAssessmentForm
            mentees={mentees}
            types={types}
            initialMenteeId={menteeId}
            loadError={loadError}
        />
    );
}
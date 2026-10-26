import { AssessmentsView } from "@/components/MentorAssessments/AssessmentsView";
import { getAssessments } from "@/services/mentor-assessments.service";

export default async function MyAssessmentsPage() {
    const assessments = await getAssessments();
    return <AssessmentsView assessments={assessments} />;
}
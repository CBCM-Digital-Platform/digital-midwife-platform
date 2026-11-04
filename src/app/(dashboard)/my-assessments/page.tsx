import { getAssessments } from "@/services/mentor-assessments.service";
import { AssessmentsView } from "@/components/MentorAssessments/AssessmentsView";

export default async function MyAssessmentsPage() {
  const assessments = await getAssessments();
  return <AssessmentsView assessments={assessments} />;
}

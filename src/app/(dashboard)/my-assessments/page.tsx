import { getAssessments } from "@/services/mentor-assessments.service";
import { AssessmentsView } from "@/components/MentorAssessments/AssessmentsView";
import type { MentorAssessment } from "@/types/mentor-assessment";

export default async function MyAssessmentsPage() {
  let assessments: MentorAssessment[] = [];
  let loadError: string | null = null;
  try {
    assessments = await getAssessments();
  } catch (error) {
    console.error("Could not load assessments:", error);
    loadError = "Unable to load assessments from the backend. Please try again later.";
  }
  return <AssessmentsView assessments={assessments} loadError={loadError} />;
}

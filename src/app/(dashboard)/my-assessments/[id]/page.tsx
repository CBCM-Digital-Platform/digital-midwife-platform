import { redirect } from "next/navigation";
import { getAssessmentDetails } from "@/services/assessment.service";
import { AssessmentGradingClient } from "@/components/MentorAssessments/AssessmentGradingClient";
import type { MentorAssessment } from "@/types/mentor-assessment";

export default async function MyAssessmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!id || id === "new") {
    redirect("/my-assessments/new");
  }

  // Fetch assessment details from real backend endpoint
  let assessment: MentorAssessment | null = null;
  let initialLoadError: string | null = null;
  try {
    assessment = await getAssessmentDetails(id);
    if (!assessment) initialLoadError = `Assessment #${id} was not found.`;
  } catch (error) {
    console.error(`Could not load assessment ${id}:`, error);
    initialLoadError = error instanceof Error ? error.message : "Unable to load assessment details.";
  }

  return (
    <AssessmentGradingClient
      assessmentId={id}
      initialAssessment={assessment}
      initialLoadError={initialLoadError}
    />
  );
}

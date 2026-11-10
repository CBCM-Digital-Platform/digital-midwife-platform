import { redirect } from "next/navigation";
import { getAssessmentById } from "@/services/mentor-assessments.service";
import { AssessmentGradingClient } from "@/components/MentorAssessments/AssessmentGradingClient";
import type { MentorAssessment } from "@/types/mentor-assessment";

export default async function Page({
  params,
}: {
  params: Promise<{ assessmentId: string }>;
}) {
  const { assessmentId } = await params;
  if (assessmentId === "new") {
    redirect("/my-assessments/new");
  }

  let assessment: MentorAssessment | null = null;
  let initialLoadError: string | null = null;
  try {
    assessment = await getAssessmentById(assessmentId);
    if (!assessment) initialLoadError = `Assessment #${assessmentId} was not found.`;
  } catch (error) {
    console.error(`Could not load assessment ${assessmentId}:`, error);
    initialLoadError = error instanceof Error ? error.message : "Unable to load assessment details.";
  }

  return (
    <AssessmentGradingClient
      assessmentId={assessmentId}
      initialAssessment={assessment}
      initialLoadError={initialLoadError}
    />
  );
}

import { notFound, redirect } from "next/navigation";
import { getAssessmentDetails } from "@/services/assessment.service";
import { AssessmentGradingClient } from "@/components/MentorAssessments/AssessmentGradingClient";

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
  const assessment = await getAssessmentDetails(id);

  return <AssessmentGradingClient assessmentId={id} initialAssessment={assessment} />;
}

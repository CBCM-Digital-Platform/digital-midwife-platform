import { notFound, redirect } from "next/navigation";
import { getAssessmentById } from "@/services/mentor-assessments.service";
import { AssessmentDetailPageClient } from "@/components/MentorAssessments/AssessmentDetailPageClient";

export default async function Page({
  params,
}: {
  params: Promise<{ assessmentId: string }>;
}) {
  const { assessmentId } = await params;
  if (assessmentId === "new") {
    redirect("/my-assessments/new");
  }

  const assessment = await getAssessmentById(assessmentId);
  if (!assessment) {
    notFound();
  }

  return <AssessmentDetailPageClient assessment={assessment} />;
}


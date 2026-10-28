import React from "react";
import {
  getMenteeAssignedResources,
  getUpcomingSessions,
  getMenteeAssessments,
} from "@/services/mentee.service";
import { MenteeLearningHubClient } from "@/components/MenteeLearning/MenteeLearningHubClient";

export const metadata = {
  title: "Learning Hub | Clinical Curriculum | CBCM Platform",
  description:
    "Mentee clinical learning hub featuring assigned materials, upcoming preceptor mentoring sessions, and pending clinical competency assessments.",
};

export default async function LearningHubPage() {
  const [resources, sessions, assessments] = await Promise.all([
    getMenteeAssignedResources(),
    getUpcomingSessions(),
    getMenteeAssessments(),
  ]);

  return (
    <MenteeLearningHubClient
      initialResources={resources}
      initialSessions={sessions}
      initialAssessments={assessments}
    />
  );
}

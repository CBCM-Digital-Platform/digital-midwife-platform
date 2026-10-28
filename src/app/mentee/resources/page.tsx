import React from "react";
import {
  getMenteeAssignedResources,
  getUpcomingSessions,
  getMenteeAssessments,
} from "@/services/mentee.service";
import { MenteeLearningHubClient } from "@/components/MenteeLearning/MenteeLearningHubClient";

export const metadata = {
  title: "Clinical Resources | Mentee Portal | CBCM Platform",
  description:
    "Curated clinical guidelines, manuals, preceptor sessions, and competency assessments for mentees.",
};

export default async function MenteeResourcesPage() {
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

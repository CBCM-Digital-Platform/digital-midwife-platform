import React from "react";
import {
  getMenteeAssignedResources,
  getUpcomingSessions,
  getMenteeAssessments,
} from "@/services/mentee.service";
import type { MenteeAssessmentItem, MenteeSessionItem } from "@/services/mentee.service";
import { MenteeLearningHubClient } from "@/components/MenteeLearning/MenteeLearningHubClient";

export const metadata = {
  title: "Clinical Resources | Mentee Portal | CBCM Platform",
  description:
    "Curated clinical guidelines, manuals, preceptor sessions, and competency assessments for mentees.",
};

export default async function MenteeResourcesPage() {
  const resources = await getMenteeAssignedResources();
  let assessments: MenteeAssessmentItem[] = [];
  let assessmentsError: string | null = null;
  try {
    assessments = await getMenteeAssessments();
  } catch (error) {
    console.error("Could not load mentee assessments:", error);
    assessmentsError = "Unable to load assessments from the backend. Please try again later.";
  }
  let sessions: MenteeSessionItem[] = [];
  let sessionsError: string | null = null;
  try {
    sessions = await getUpcomingSessions();
  } catch (error) {
    console.error("Could not load mentee sessions:", error);
    sessionsError = "Unable to load sessions from the backend. Please try again later.";
  }

  return (
    <MenteeLearningHubClient
      initialResources={resources}
      initialSessions={sessions}
      initialAssessments={assessments}
      sessionsError={sessionsError}
      assessmentsError={assessmentsError}
    />
  );
}

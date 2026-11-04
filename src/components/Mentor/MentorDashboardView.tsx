import React from "react";
import { getMentorDashboard } from "../../services/mentor-dashboard.service";
import { MentorDashboardClient } from "./MentorDashboardClient";

export interface MentorDashboardViewProps {
  displayName: string;
  mentorId?: string | number;
}

export async function MentorDashboardView({ displayName, mentorId }: MentorDashboardViewProps) {
  const data = await getMentorDashboard(mentorId);

  return <MentorDashboardClient displayName={displayName} data={data} />;
}

export default MentorDashboardView;

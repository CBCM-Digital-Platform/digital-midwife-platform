import React from "react";
import { getMentorDashboard } from "../../services/mentor-dashboard.service";
import { MentorDashboardClient } from "./MentorDashboardClient";

export interface MentorDashboardViewProps {
  displayName: string;
}

export async function MentorDashboardView({ displayName }: MentorDashboardViewProps) {
  const data = await getMentorDashboard();

  return <MentorDashboardClient displayName={displayName} data={data} />;
}

export default MentorDashboardView;

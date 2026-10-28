import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { ResourceLibraryView } from "@/components/ResourceLibrary/ResourceLibraryView";
import { getResources as getLearnerResources } from "@/services/resource-library.service";
import { getResources as getAdminResources } from "@/services/resources.service";
import { getMentors } from "@/services/users.service";
import { SuperAdminResourcesTableClient } from "@/components/ResourceLibrary/SuperAdminResourcesTableClient";
import { FacilityAdminResourcesTableClient } from "@/components/ResourceLibrary/FacilityAdminResourcesTableClient";
import {
  getMenteeAssignedResources,
  getUpcomingSessions,
  getMenteeAssessments,
} from "@/services/mentee.service";
import { MenteeLearningHubClient } from "@/components/MenteeLearning/MenteeLearningHubClient";

export const metadata = {
  title: "Clinical Resources | CBCM Platform",
  description:
    "Curated clinical guidelines, manuals, preceptor sessions, and instructional videos for midwife mentors and mentees.",
};

export default async function ResourcesPage() {
  const session = await getServerSession(authOptions);
  const rawRole = (session?.user as any)?.role || "mentee";
  const normalizedRole = String(rawRole).toLowerCase().replace(/[-_\s]/g, "");

  const isFacilityAdmin =
    normalizedRole.includes("facilityadmin") ||
    rawRole === "facility_admin";

  if (isFacilityAdmin) {
    const [adminResources, mentors] = await Promise.all([
      getAdminResources(),
      getMentors(),
    ]);
    return (
      <FacilityAdminResourcesTableClient
        initialResources={adminResources}
        availableMentors={mentors}
      />
    );
  }

  const isSuperAdmin =
    normalizedRole.includes("superadmin") ||
    rawRole === "super_admin" ||
    normalizedRole === "admin";

  if (isSuperAdmin) {
    const adminResources = await getAdminResources();
    return <SuperAdminResourcesTableClient initialResources={adminResources} />;
  }

  const isMentee =
    normalizedRole.includes("mentee") ||
    rawRole === "mentee" ||
    !rawRole;

  if (isMentee) {
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

  // Fallback for mentors or other roles
  const learnerResources = await getLearnerResources();
  return <ResourceLibraryView resources={learnerResources} />;
}

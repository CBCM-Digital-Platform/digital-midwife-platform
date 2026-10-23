import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import ReportsView from "@/components/Reports/ReportsView";
import { SuperAdminReportsView } from "@/components/SuperAdmin/SuperAdminReportsView";
import { getReportsData } from "@/services/report-data.service";
import { getFacilities } from "@/services/facilities.service";
import { getFacilityAdmins } from "@/services/facility-admins.service";
import { getThematicAreas } from "@/services/thematic-areas.service";
import { apiClient } from "@/lib/api-client";

export default async function ReportsPage() {
  const session = await getServerSession(authOptions);
  const rawRole = ((session?.user as any)?.role || "").toLowerCase();
  const isSuperAdmin =
    rawRole === "super_admin" ||
    (rawRole.includes("admin") && !rawRole.includes("facility"));

  const reportsData = await getReportsData();

  // 1. SUPER ADMIN TAILORED REPORTS VIEW
  if (isSuperAdmin) {
    const [facilities, facilityAdmins, thematicAreas, mentorsRes, menteesRes] =
      await Promise.all([
        getFacilities().catch(() => []),
        getFacilityAdmins().catch(() => []),
        getThematicAreas().catch(() => []),
        apiClient<any>("/api/v1/users?role=mentor").catch(() => null),
        apiClient<any>("/api/v1/users?role=mentee").catch(() => null),
      ]);

    const mentorsList = Array.isArray(mentorsRes?.data)
      ? mentorsRes.data
      : Array.isArray(mentorsRes?.users)
      ? mentorsRes.users
      : Array.isArray(mentorsRes)
      ? mentorsRes
      : [];
    const menteesList = Array.isArray(menteesRes?.data)
      ? menteesRes.data
      : Array.isArray(menteesRes?.users)
      ? menteesRes.users
      : Array.isArray(menteesRes)
      ? menteesRes
      : [];

    return (
      <SuperAdminReportsView
        facilities={facilities}
        facilityAdmins={facilityAdmins}
        thematicAreas={thematicAreas}
        reportsData={reportsData}
        totalMentors={mentorsList.length}
        totalMentees={menteesList.length}
      />
    );
  }

  // 2. FACILITY ADMIN / CLINICAL MENTORSHIP REPORTS VIEW (UNALTERED)
  return <ReportsView data={reportsData} />;
}

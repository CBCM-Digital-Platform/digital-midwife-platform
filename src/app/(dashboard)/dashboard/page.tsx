import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { apiClient } from "@/lib/api-client";
import { formatWelcomeName } from "@/lib/utils";
import { getFacilities } from "@/services/facilities.service";
import { getFacilityAdmins } from "@/services/facility-admins.service";
import { getThematicAreas } from "@/services/thematic-areas.service";
import {
  SuperAdminDashboardView,
  FacilityAdminDashboardView,
  MentorDashboardView,
  MenteeDashboardView,
} from "@/components/Dashboard";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const rawRole = ((session?.user as any)?.role || "").toLowerCase();
  const isSuperAdmin =
    rawRole === "super_admin" ||
    (rawRole.includes("admin") && !rawRole.includes("facility"));
  const isFacilityAdmin =
    rawRole === "facility_admin" || rawRole.includes("facility");
  const isMentor = rawRole.includes("mentor");
  const userName = session?.user?.name || "Administrator";
  const displayName = formatWelcomeName(userName);
  const userRoleLabel = isFacilityAdmin
    ? "Facility Administrator"
    : "System Administrator";

  // =========================================================================
  // 1. SUPER ADMIN (SYSTEM ADMINISTRATOR) DASHBOARD
  // =========================================================================
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
      <SuperAdminDashboardView
        userName={userName}
        facilities={facilities}
        facilityAdmins={facilityAdmins}
        thematicAreas={thematicAreas}
        totalMentors={mentorsList.length}
        totalMentees={menteesList.length}
      />
    );
  }

  // =========================================================================
  // 2. FACILITY ADMIN DASHBOARD (CONNECTED TO LIVE BACKEND)
  // =========================================================================
  if (isFacilityAdmin || rawRole.includes("admin")) {
    let mentors: any[] = [];
    let mentees: any[] = [];
    let cycles: any[] = [];
    let facilities: any[] = [];

    try {
      const [mentorsRes, menteesRes, cyclesRes, facilitiesRes] = await Promise.all([
        apiClient<any>("/api/v1/users?role=mentor").catch(() => null),
        apiClient<any>("/api/v1/users?role=mentee").catch(() => null),
        apiClient<any>("/api/v1/mentorship-cycles").catch(() => null),
        apiClient<any>("/api/v1/facilities").catch(() => null),
      ]);

      mentors = Array.isArray(mentorsRes?.data)
        ? mentorsRes.data
        : Array.isArray(mentorsRes?.users)
        ? mentorsRes.users
        : Array.isArray(mentorsRes)
        ? mentorsRes
        : [];
      mentees = Array.isArray(menteesRes?.data)
        ? menteesRes.data
        : Array.isArray(menteesRes?.users)
        ? menteesRes.users
        : Array.isArray(menteesRes)
        ? menteesRes
        : [];
      cycles = Array.isArray(cyclesRes?.data)
        ? cyclesRes.data
        : Array.isArray(cyclesRes?.cycles)
        ? cyclesRes.cycles
        : Array.isArray(cyclesRes)
        ? cyclesRes
        : [];
      facilities = Array.isArray(facilitiesRes?.data)
        ? facilitiesRes.data
        : Array.isArray(facilitiesRes?.facilities)
        ? facilitiesRes.facilities
        : Array.isArray(facilitiesRes)
        ? facilitiesRes
        : [];
    } catch (err) {
      console.warn("Failed to fetch live admin dashboard metrics:", err);
    }

    const activeCycle = cycles[0] || {
      name: "2026 Mentorship Cycle 1",
      status: "planned",
      start_date: "2026-11-01",
      end_date: "2027-04-30",
    };

    const userFacilityId =
      (session?.user as any)?.facility_id ?? (session?.user as any)?.facilityId;

    const assignedFacility = userFacilityId
      ? facilities.find((f: any) => String(f.id) === String(userFacilityId))
      : null;

    const primaryFacility = assignedFacility || {
      name: userFacilityId
        ? `Facility #${userFacilityId}`
        : facilities[0]?.name || "Assigned Facility",
      region: facilities[0]?.region || "Regional Center",
      type: facilities[0]?.type || "Hospital",
    };

    // Filter clinicians strictly to the logged-in facility admin's facility
    const facilityMentors = userFacilityId
      ? mentors.filter((m: any) => {
          const mFacId = m.facility_id ?? m.facilityId ?? m.facility?.id;
          return String(mFacId ?? "") === String(userFacilityId);
        })
      : mentors;

    const facilityMentees = userFacilityId
      ? mentees.filter((m: any) => {
          const mFacId = m.facility_id ?? m.facilityId ?? m.facility?.id;
          return String(mFacId ?? "") === String(userFacilityId);
        })
      : mentees;

    const totalClinicians = facilityMentors.length + facilityMentees.length;
    const activeMentors = facilityMentors.filter((m) => m.status === "active").length;
    const activeMentees = facilityMentees.filter((m) => m.status === "active").length;

    return (
      <FacilityAdminDashboardView
        displayName={displayName}
        userRoleLabel={userRoleLabel}
        primaryFacility={primaryFacility}
        activeCycle={activeCycle}
        facilityMentors={facilityMentors}
        facilityMentees={facilityMentees}
        totalClinicians={totalClinicians}
        activeMentors={activeMentors}
        activeMentees={activeMentees}
        facilities={facilities}
        userFacilityId={userFacilityId}
      />
    );
  }

  // =========================================================================
  // 3. MENTOR DASHBOARD
  // =========================================================================
  if (isMentor) {
    return <MentorDashboardView displayName={displayName} />;
  }

  // =========================================================================
  // 4. MENTEE STUDENT DASHBOARD
  // =========================================================================
  return <MenteeDashboardView displayName={displayName} />;
}

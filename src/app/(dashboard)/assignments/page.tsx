import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import AssignmentsView from "@/components/Assignment/AssignmentsView";
import { getAssignments, getAssignmentStats } from "@/services/assignments.service";
import { isAdminRole } from "@/types/navigation";

export default async function AssignmentsPage() {
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string } | undefined)?.role;

    // Assignments are managed by admins only.
    if (!isAdminRole(role)) redirect("/dashboard");

    const facilityId = (session?.user as any)?.facility_id ?? (session?.user as any)?.facilityId;
    const [assignments, stats] = await Promise.all([getAssignments(facilityId), getAssignmentStats(facilityId)]);

    return <AssignmentsView assignments={assignments} stats={stats} />;
}
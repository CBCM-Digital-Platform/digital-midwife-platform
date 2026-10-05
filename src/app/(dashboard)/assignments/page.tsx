import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import AssignmentsView from "@/components/Assignment/AssignmentsView";
import { getAssignments, getAssignmentStats } from "@/services/assignments.service";

export default async function AssignmentsPage() {
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string } | undefined)?.role;

    // Assignments are managed by admins only.
    if (role !== "admin") redirect("/dashboard");

    const [assignments, stats] = await Promise.all([getAssignments(), getAssignmentStats()]);

    return <AssignmentsView assignments={assignments} stats={stats} />;
}
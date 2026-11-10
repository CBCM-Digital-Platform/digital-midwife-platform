import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getAssignmentById } from "@/services/assignments.service";
import { isAdminRole } from "@/types/navigation";

function DetailRow({ label, value }: { label: string; value?: string | number }) {
    return (
        <div className="border-b border-gray-100 py-4 last:border-b-0">
            <dt className="text-sm text-gray-500">{label}</dt>
            <dd className="mt-1 break-words text-sm font-medium text-gray-900">
                {value === undefined || value === null || value === "" ? "Not provided by backend" : value}
            </dd>
        </div>
    );
}

export default async function AssignmentDetailPage({
    params,
}: {
    params: Promise<{ assignmentId: string }>;
}) {
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string } | undefined)?.role;
    if (!isAdminRole(role)) redirect("/dashboard");

    const { assignmentId } = await params;
    if (!/^\d+$/.test(assignmentId)) notFound();

    let assignment;
    try {
        assignment = await getAssignmentById(assignmentId);
    } catch (error) {
        console.error(`Could not load assignment ${assignmentId} from the backend:`, error);
        return (
            <main className="mx-auto max-w-3xl space-y-6">
                <Link href="/assignments" className="text-sm font-medium text-[#194611] hover:underline">
                    &larr; Back to assignments
                </Link>
                <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
                    <h1 className="font-semibold">Unable to load assignment details</h1>
                    <p className="mt-1">
                        {error instanceof Error ? error.message : "The backend request failed. Please try again."}
                    </p>
                </div>
            </main>
        );
    }

    if (!assignment) notFound();

    const mentees = assignment.mentees?.length ? assignment.mentees : [assignment.mentee];
    return (
        <main className="mx-auto max-w-3xl space-y-6">
            <div className="space-y-3">
                <Link href="/assignments" className="text-sm font-medium text-[#194611] hover:underline">
                    &larr; Back to assignments
                </Link>
                <div>
                    <p className="text-sm text-gray-500">Assignment #{assignment.id}</p>
                    <h1 className="mt-1 text-3xl font-bold text-[#194611]">Assignment Details</h1>
                    <p className="mt-2 text-sm text-gray-600">
                        Details loaded from the backend assignment record.
                    </p>
                </div>
            </div>

            <section className="rounded-xl border border-gray-200 bg-white p-6">
                <h2 className="text-lg font-semibold text-gray-900">Mentorship Pairing</h2>
                <dl className="mt-3">
                    <DetailRow label="Mentor" value={assignment.mentor.name} />
                    <DetailRow label="Mentee(s)" value={mentees.map((mentee) => mentee.name).join(", ")} />
                    <DetailRow label="Facility" value={assignment.facility} />
                    <DetailRow label="Thematic area" value={assignment.thematicDomain} />
                    <DetailRow label="Mentorship cycle" value={assignment.cycleName} />
                    <DetailRow label="Status" value={assignment.backendStatus ?? assignment.status} />
                    <DetailRow label="Assigned date" value={assignment.assignedDate} />
                    <DetailRow label="Backend assignment ID" value={assignment.id} />
                    <DetailRow label="Facility ID" value={assignment.facilityId} />
                    <DetailRow label="Cycle ID" value={assignment.cycleId} />
                    <DetailRow label="Thematic area ID" value={assignment.thematicAreaId} />
                    <DetailRow label="Matching reason" value={assignment.matchingReason} />
                </dl>
            </section>
        </main>
    );
}

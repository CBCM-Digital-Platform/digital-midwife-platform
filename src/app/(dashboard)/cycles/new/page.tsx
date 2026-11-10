import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Link from "next/link";
import CreateCycleForm from "@/components/Cycle/CreateCycleForm";
import { getFacilities } from "@/services/cycle-data.service";
import { getThematicAreas } from "@/services/thematic-areas.service";

export default async function NewCyclePage() {
    const session = await getServerSession(authOptions);
    const user = session?.user;
    const facilityId = user?.facility_id ?? user?.facilityId ?? null;
    const isFacilityAdmin = user?.role?.toLowerCase() === "facility_admin";
    if (isFacilityAdmin && facilityId === null) {
        return (
            <div className="p-6">
                <p className="mb-4 text-sm text-red-700">
                    Your account is not associated with a facility. Ask an administrator to assign your facility before creating a cycle.
                </p>
                <Link href="/cycles" className="text-sm font-medium text-[#0B5D3B] hover:underline">
                    Return to cycles
                </Link>
            </div>
        );
    }

    let facilities: Awaited<ReturnType<typeof getFacilities>> = [];
    let thematicAreas: Awaited<ReturnType<typeof getThematicAreas>> = [];
    try {
        [facilities, thematicAreas] = await Promise.all([
            getFacilities(),
            getThematicAreas(),
        ]);
    } catch (error) {
        console.error("Could not load cycle creation data:", error);
        return (
            <div className="p-6">
                <p role="alert" className="mb-4 text-sm text-red-700">
                    Cycle creation data could not be loaded. Check your connection and try again.
                </p>
                <Link href="/cycles" className="text-sm font-medium text-[#0B5D3B] hover:underline">
                    Return to cycles
                </Link>
            </div>
        );
    }
    const availableFacilities = isFacilityAdmin
        ? facilities.filter((facility) => String(facility.id) === String(facilityId))
        : facilities;
    if (isFacilityAdmin && availableFacilities.length === 0) {
        return (
            <div className="p-6">
                <p className="mb-4 text-sm text-red-700">
                    Your assigned facility could not be found. Refresh the page or ask an administrator to verify your facility assignment.
                </p>
                <Link href="/cycles" className="text-sm font-medium text-[#0B5D3B] hover:underline">
                    Return to cycles
                </Link>
            </div>
        );
    }
    return (
        <CreateCycleForm
            facilities={availableFacilities}
            thematicAreasList={thematicAreas}
            defaultFacilityId={facilityId ? String(facilityId) : undefined}
            ownerFacilityId={isFacilityAdmin ? facilityId ?? undefined : undefined}
        />
    );
}

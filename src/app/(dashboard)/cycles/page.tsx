import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import CyclesView from "@/components/Cycle/CyclesView";
import { getCycles } from "@/services/cycle-data.service";
import type { Cycle } from "@/types/cycle";

export default async function CyclesPage() {
    const session = await getServerSession(authOptions);
    const user = session?.user;
    const facilityId = user?.facility_id ?? user?.facilityId ?? null;
    const role = user?.role?.toLowerCase();
    const isFacilityAdmin = role === "facility_admin";

    // Facility admins see cycles linked to their facility; global admins see all cycles.
    const scopedFacilityId = isFacilityAdmin ? (facilityId ?? -1) : undefined;
    let cycles: Cycle[] = [];
    let loadError: string | null = null;
    try {
        cycles = await getCycles({ facilityId: scopedFacilityId });
    } catch (error) {
        console.error("Could not load mentorship cycles:", error);
        loadError = "Unable to load cycles. Check your connection and try again.";
    }

    return (
        <CyclesView
            cycles={cycles}
            facilityId={isFacilityAdmin ? facilityId : null}
            isFacilityAdmin={isFacilityAdmin}
            loadError={loadError}
        />
    );
}

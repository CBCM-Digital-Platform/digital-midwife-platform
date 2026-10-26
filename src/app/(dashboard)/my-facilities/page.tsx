import { FacilitiesOverviewView } from "@/components/FacilityOverview/FacilitiesOverviewView";
import { getFacilityOverviewData, getAvailableMenteesForAssignment } from "@/services/facility-overview.service";

export const metadata = {
    title: "Facilities Overview | Center for Adolescent Girls Health",
    description: "Monitoring clinical sites and mentee distribution across the region.",
};

export default async function MyFacilitiesPage() {
    const [{ stats, facilities }, availableMentees] = await Promise.all([
        getFacilityOverviewData(),
        getAvailableMenteesForAssignment(),
    ]);

    return (
        <FacilitiesOverviewView
            initialStats={stats}
            initialFacilities={facilities}
            availableMentees={availableMentees}
        />
    );
}
import { FacilityRosterView } from "@/components/FacilityRoster/FacilityRosterView";
import { getFacilityRoster } from "@/services/my-mentees.service";

export default async function MyFacilityRosterPage({
    searchParams,
}: {
    searchParams: Promise<{ facility?: string }>;
}) {
    const { facility } = await searchParams;
    const { asOf, mentees } = await getFacilityRoster();

    return <FacilityRosterView mentees={mentees} asOf={asOf} initialFacility={facility ?? "ALL"} />;
}
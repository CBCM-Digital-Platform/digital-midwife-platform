import CreateCycleForm from "@/components/Cycle/CreateCycleForm";
import { getFacilities } from "@/services/cycle-data.service";
import { getThematicAreas } from "@/services/thematic-areas.service";

export default async function NewCyclePage() {
    const [facilities, thematicAreas] = await Promise.all([
        getFacilities(),
        getThematicAreas(),
    ]);
    return <CreateCycleForm facilities={facilities} thematicAreasList={thematicAreas} />;
}

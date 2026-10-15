import CreateCycleForm from "@/components/Cycle/CreateCycleForm";
import { getFacilities } from "@/services/cycle-data.service";

export default async function NewCyclePage() {
    const facilities = await getFacilities();
    return <CreateCycleForm facilities={facilities} />;
}
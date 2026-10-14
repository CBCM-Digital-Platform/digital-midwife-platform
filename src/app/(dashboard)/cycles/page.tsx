import CyclesView from "@/components/Cycle/CyclesView";
import { getCycles } from "@/services/cycle-data.service";

export default async function CyclesPage() {
    const cycles = await getCycles();
    return <CyclesView cycles={cycles} />;
}
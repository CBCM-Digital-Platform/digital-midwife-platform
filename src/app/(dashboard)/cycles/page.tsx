import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import CyclesView from "@/components/Cycle/CyclesView";
import { getCycles } from "@/services/cycle-data.service";

export default async function CyclesPage() {
    const session = await getServerSession(authOptions);
    const facilityId = (session?.user as any)?.facility_id ?? null;
    const role = (session?.user as any)?.role ?? "";

    // Super admin sees ALL cycles; facility admin sees only their facility's cycles
    const cycles = await getCycles({ facilityId: role === "super_admin" ? undefined : facilityId });
    return <CyclesView cycles={cycles} />;
}

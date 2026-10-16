import ReportsView from "@/components/Reports/ReportsView";
import { getReportsData } from "@/services/report-data.service";

export default async function ReportsPage() {
    const data = await getReportsData();
    return <ReportsView data={data} />;
}
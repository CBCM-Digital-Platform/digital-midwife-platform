import Link from "next/link";
import { getMenteeDashboard } from "@/services/mentee-dashboard.service";
import { HeroBanner } from "@/components/MenteeDashboard/HeroBanner";
import { SummaryCards } from "@/components/MenteeDashboard/SummaryCards";
import { CurriculumBreakdown } from "@/components/MenteeDashboard/CurriculumBreakdown";
import { SidePanel } from "@/components/MenteeDashboard/SidePanel";

export interface MenteeDashboardViewProps {
  displayName: string;
}

export async function MenteeDashboardView({ displayName }: MenteeDashboardViewProps) {
  const data = await getMenteeDashboard();

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <HeroBanner displayName={displayName} resume={data.resume} />

      <SummaryCards
        summary={data.summary}
        modulePassRate={data.modulePassRate}
        cpdHours={data.cpdHours}
        cpdTarget={data.cpdTarget}
      />

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_320px]">
        <CurriculumBreakdown chapters={data.chapters} summary={data.summary} />
        <SidePanel mentor={data.mentor} handbook={data.handbook} />
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-200 pt-4 text-xs text-gray-500">
        <p>
          © {new Date().getFullYear()} Center for Adolescent Girls Health • Midwifery & Obstetric
          Clinical Education Program
        </p>
        <div className="flex gap-4">
          <Link href="/resources" className="hover:text-gray-800">
            Clinical Protocols
          </Link>
          {/* TODO: link the privacy policy and support hotline pages once they exist */}
          <span>Privacy Policy</span>
          <span>Support Hotline</span>
        </div>
      </footer>
    </div>
  );
}
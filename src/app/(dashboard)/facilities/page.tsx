import React from "react";
import { getFacilities } from "@/services/facilities.service";
import { PageHeader } from "@/components/common/PageHeader";
import { FacilitiesTableClient } from "@/components/Facility/FacilitiesTableClient";
import { Building2 } from "lucide-react";

export const metadata = {
  title: "Facility Management | Super Admin | CBCM Platform",
  description:
    "Manage accredited clinical healthcare facilities, preceptors, and operational hospital capacity.",
};

export default async function SuperAdminFacilitiesPage() {
  const facilities = await getFacilities();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Facility Management"
        description="Oversee partner health facilities, hospital departments, clinical capacity, and assigned midwifery mentorship programs across regions."
        badge={
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-[#194611] border border-green-200">
            <Building2 className="h-3.5 w-3.5" />
            {facilities.length} Facilities
          </span>
        }
      />

      <FacilitiesTableClient initialFacilities={facilities} />
    </div>
  );
}

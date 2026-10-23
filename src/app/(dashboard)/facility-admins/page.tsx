import React from "react";
import { getFacilityAdmins } from "@/services/facility-admins.service";
import { getFacilities } from "@/services/facilities.service";
import { PageHeader } from "@/components/common/PageHeader";
import { FacilityAdminsTableClient } from "@/components/FacilityAdmin/FacilityAdminsTableClient";
import { ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Facility Admin Management | Super Admin | CBCM Platform",
  description:
    "Manage accredited healthcare facility administrators, facility assignments, and mentorship operations.",
};

export default async function SuperAdminFacilityAdminsPage() {
  const [admins, facilities] = await Promise.all([
    getFacilityAdmins(),
    getFacilities(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Facility Admin Management"
        description="Oversee appointed hospital administrators, manage facility operational credentials, and audit mentorship preceptor supervision permissions."
        badge={
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-[#194611] border border-green-200">
            <ShieldCheck className="h-3.5 w-3.5" />
            {admins.length} Facility Admins
          </span>
        }
      />

      <FacilityAdminsTableClient
        initialAdmins={admins}
        facilities={facilities}
      />
    </div>
  );
}

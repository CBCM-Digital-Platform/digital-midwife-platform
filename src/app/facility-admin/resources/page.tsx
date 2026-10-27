import React from "react";
import { getResources } from "@/services/resources.service";
import { getMentors } from "@/services/users.service";
import { FacilityAdminResourcesTableClient } from "@/components/ResourceLibrary/FacilityAdminResourcesTableClient";

export const metadata = {
  title: "Facility Resource Library | CBCM Platform",
  description:
    "Browse master clinical guidelines, training videos, and protocols to assign to facility midwife mentors.",
};

export default async function FacilityAdminResourcesPage() {
  const [resources, mentors] = await Promise.all([
    getResources(),
    getMentors(),
  ]);

  return (
    <FacilityAdminResourcesTableClient
      initialResources={resources}
      availableMentors={mentors}
    />
  );
}

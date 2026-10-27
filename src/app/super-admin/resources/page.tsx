import React from "react";
import { getResources } from "@/services/resources.service";
import { SuperAdminResourcesTableClient } from "@/components/ResourceLibrary/SuperAdminResourcesTableClient";

export const metadata = {
  title: "Resource Library | Super Admin | CBCM Platform",
  description:
    "Super Admin Resource Library for clinical guidelines, instructional videos, and digital mentorship reference materials.",
};

export default async function SuperAdminResourcesPage() {
  const resources = await getResources();

  return <SuperAdminResourcesTableClient initialResources={resources} />;
}

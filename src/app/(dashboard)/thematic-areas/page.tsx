import React from "react";
import { getThematicAreas } from "@/services/thematic-areas.service";
import { ThematicAreasTableClient } from "@/components/ThematicArea/ThematicAreasTableClient";

export const metadata = {
  title: "Thematic Areas | Super Admin | CBCM Platform",
  description:
    "Manage accredited clinical learning domains, competencies, and adolescent health curriculum thematic areas.",
};

export default async function SuperAdminThematicAreasPage() {
  const thematicAreas = await getThematicAreas();

  return <ThematicAreasTableClient initialThematicAreas={thematicAreas} />;
}

import React from "react";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getModules } from "@/services/learning.service";
import { getThematicAreas } from "@/services/thematic-areas.service";
import { LearningModulesListClient } from "@/components/LearningModules/LearningModulesListClient";

export const metadata = {
  title: "Clinical Learning Modules | CBCM Platform",
  description:
    "Curated clinical learning modules, procedural guidelines, and preceptor-guided competency packages.",
};

export default async function LearningModulesPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  const rawRole = String(user?.role || "mentee").toLowerCase().replace(/[-_\s]/g, "");

  // Route guard: Facility Admin cannot access Learning Modules
  if (rawRole.includes("facilityadmin") || user?.role === "facility_admin") {
    redirect("/dashboard");
  }

  const [modules, thematicAreas] = await Promise.all([
    getModules(),
    getThematicAreas().catch(() => []),
  ]);

  return (
    <LearningModulesListClient
      initialModules={modules}
      initialThematicAreas={thematicAreas.map((a) => a.name).filter(Boolean)}
      userRole={user?.role || "mentee"}
      currentUserId={user?.id || user?.userId}
      currentUserEmail={user?.email}
      currentUserName={user?.name}
      mentorThematicAreaId={user?.thematic_area_id || user?.thematicAreaId}
    />
  );
}

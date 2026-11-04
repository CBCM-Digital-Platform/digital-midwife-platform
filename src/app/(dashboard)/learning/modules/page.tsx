import React from "react";
import { getServerSession } from "next-auth/next";
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
  const [session, modules, thematicAreas] = await Promise.all([
    getServerSession(authOptions),
    getModules(),
    getThematicAreas().catch(() => []),
  ]);

  const user = session?.user as any;
  const rawRole = user?.role || "mentee";

  return (
    <LearningModulesListClient
      initialModules={modules}
      initialThematicAreas={thematicAreas.map((a) => a.name).filter(Boolean)}
      userRole={rawRole}
      currentUserId={user?.id || user?.userId}
      currentUserEmail={user?.email}
      currentUserName={user?.name}
    />
  );
}

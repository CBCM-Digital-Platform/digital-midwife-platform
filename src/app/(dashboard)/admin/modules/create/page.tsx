import React from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getThematicAreas } from "@/services/thematic-areas.service";
import { CreateModuleWizardClient } from "@/components/LearningModules/CreateModuleWizardClient";

export const metadata = {
  title: "Create Learning Module | Super Admin | CBCM Platform",
  description:
    "Super Admin Curriculum Wizard to establish standardized clinical modules, define competency frameworks, and upload training resources.",
};

export default async function CreateLearningModulePage() {
  await getServerSession(authOptions);
  const thematicAreas = await getThematicAreas();

  return <CreateModuleWizardClient thematicAreas={thematicAreas} />;
}

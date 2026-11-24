import React from "react";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getThematicAreas } from "@/services/thematic-areas.service";
import { CreateModuleWizardClient } from "@/components/LearningModules/CreateModuleWizardClient";

export const metadata = {
  title: "Create Learning Module | Super Admin | CBCM Platform",
  description:
    "Super Admin Curriculum Wizard to establish standardized clinical modules, define competency frameworks, and upload training resources.",
};

export default async function CreateLearningModulePage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  const rawRole = String(user?.role || "mentee").toLowerCase().replace(/[-_\s]/g, "");

  // Route guard: Only Super Admin can create learning modules. Facility Admin is blocked.
  if (rawRole.includes("facilityadmin") || user?.role === "facility_admin") {
    redirect("/dashboard");
  }
  if (!rawRole.includes("superadmin") && rawRole !== "admin") {
    redirect("/dashboard");
  }

  const thematicAreas = await getThematicAreas();

  return <CreateModuleWizardClient thematicAreas={thematicAreas} />;
}

import React from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getModules } from "@/services/learning.service";
import { LearningModulesListClient } from "@/components/LearningModules/LearningModulesListClient";

export const metadata = {
  title: "Clinical Learning Modules | CBCM Platform",
  description:
    "Curated clinical learning modules, procedural guidelines, and preceptor-guided competency packages.",
};

export default async function LearningModulesPage() {
  const [session, modules] = await Promise.all([
    getServerSession(authOptions),
    getModules(),
  ]);

  const rawRole = (session?.user as any)?.role || "mentee";

  return (
    <LearningModulesListClient
      initialModules={modules}
      userRole={rawRole}
    />
  );
}

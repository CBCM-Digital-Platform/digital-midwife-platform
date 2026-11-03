import React from "react";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import {
  getModuleDetails,
  getModuleContents,
  getModuleMentorAccessList,
} from "@/services/learning.service";
import { ModuleDetailClient } from "@/components/LearningModules/ModuleDetailClient";

interface ModuleDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ModuleDetailPageProps) {
  const { id } = await params;
  const module = await getModuleDetails(id);
  if (!module) {
    return { title: "Learning Module Not Found | CBCM Platform" };
  }
  return {
    title: `${module.title} | Learning Module | CBCM Platform`,
    description: module.description || "Clinical learning module curriculum and resources.",
  };
}

export default async function LearningModuleDetailPage({ params }: ModuleDetailPageProps) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  const [module, contents, mentors] = await Promise.all([
    getModuleDetails(id),
    getModuleContents(id),
    getModuleMentorAccessList(id),
  ]);

  if (!module) {
    notFound();
  }

  const userRole = (session?.user as any)?.role || "mentor";

  // Prefer contents fetched from /contents or fallback to module.contents
  const finalContents =
    contents && contents.length > 0
      ? contents
      : module?.contents && module.contents.length > 0
      ? module.contents
      : [];

  return (
    <ModuleDetailClient
      module={module}
      initialContents={finalContents}
      initialMentors={mentors}
      userRole={userRole}
    />
  );
}

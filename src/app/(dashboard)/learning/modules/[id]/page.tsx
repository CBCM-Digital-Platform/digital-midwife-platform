import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import {
  getModuleDetails,
  getModuleContents,
  getModuleMentorAccessList,
} from "@/services/learning.service";
import { ModuleDetailClient } from "@/components/LearningModules/ModuleDetailClient";
import { ShieldAlert, ArrowLeft } from "lucide-react";

interface ModuleDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ModuleDetailPageProps) {
  const { id } = await params;
  const module = await getModuleDetails(id);
  if (!module) {
    return { title: "Learning Module Not Found | CBCM Platform" };
  }
  if (module.isAccessRestricted) {
    return { title: "Access Restricted | Learning Module | CBCM Platform" };
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

  if (module.isAccessRestricted) {
    return (
      <div className="max-w-xl mx-auto my-16 bg-white rounded-2xl border border-gray-200 p-8 shadow-xs text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Facility Access Restriction</h2>
        <p className="text-xs sm:text-sm text-gray-600 leading-relaxed max-w-md mx-auto">
          This clinical learning module is restricted to its designated healthcare facility. Your account does not have facility administration permissions for this module.
        </p>
        <div className="pt-2">
          <Link
            href="/learning/modules"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#194611] text-white rounded-lg text-xs font-semibold hover:bg-[#13360d] transition shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Learning Modules
          </Link>
        </div>
      </div>
    );
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

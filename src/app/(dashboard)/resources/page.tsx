import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export default async function ResourcesPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  const rawRole = String(user?.role || "mentee").toLowerCase().replace(/[-_\s]/g, "");

  // Route guard: Facility Admin is redirected to dashboard, others to learning modules
  if (rawRole.includes("facilityadmin") || user?.role === "facility_admin") {
    redirect("/dashboard");
  }

  redirect("/learning/modules");
}

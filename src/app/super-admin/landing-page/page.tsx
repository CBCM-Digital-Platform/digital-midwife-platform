import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { LandingPageManagement } from "@/components/SuperAdmin/LandingPageManagement";
import newsManagement from "@/lib/news-management";

export const metadata = {
  title: "Landing Page Management | Super Admin | CBCM Platform",
  description: "Manage the public landing page content.",
};

export default async function LandingPageManagementScreen() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const role = (session.user as { role?: string } | undefined)?.role;
  if (!newsManagement.isNewsAdminRole(role)) redirect("/dashboard");

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Landing Page</h1>
        <p className="mt-1 text-sm text-gray-600">
          Update the public landing page content, images, feature cards, roles, and impact statistics.
          Removed items disappear after you save.
        </p>
      </header>
      <LandingPageManagement />
    </section>
  );
}

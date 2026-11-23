import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NewsManagement } from "@/components/News/NewsManagement";
import newsManagement from "@/lib/news-management";

export default async function NewsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const role = (session.user as { role?: string } | undefined)?.role;
  if (!newsManagement.isNewsAdminRole(role)) redirect("/dashboard");

  return <NewsManagement />;
}

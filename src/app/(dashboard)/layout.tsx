import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { Bell, Search, AlertCircle } from "lucide-react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

type UserRole = "admin" | "mentor" | "mentee";

type NavLink = {
  name: string;
  href: string;
  active?: boolean;
};

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getServerSession(authOptions);

  // Safely read the custom role from the session.
  const rawRole = (session?.user as { role?: unknown } | undefined)?.role;

  const role: UserRole =
    rawRole === "admin" || rawRole === "mentor" || rawRole === "mentee"
      ? rawRole
      : "mentee";

  const mentorLinks: NavLink[] = [
    { name: "Dashboard", href: "/dashboard", active: true },
    { name: "Mentees", href: "/mentees" },
    { name: "Facilities", href: "/facilities" },
    { name: "Assignments", href: "/assignments" },
    { name: "Resources", href: "/resources" },
    { name: "Clinical Assistant", href: "/ai-assistant" },
    { name: "Sessions", href: "/sessions" },
  ];

  const menteeLinks: NavLink[] = [
    { name: "Dashboard", href: "/dashboard", active: true },
    { name: "Learning", href: "/learning" },
    { name: "Clinical Skills", href: "/clinical-skills" },
    { name: "Mentors", href: "/mentors" },
    { name: "Profile", href: "/profile" },
    { name: "Messages", href: "/messaging" },
    { name: "Progress", href: "/progress" },
    { name: "Clinical Assistant", href: "/ai-assistant" },
  ];

  const adminLinks: NavLink[] = [
    { name: "Dashboard", href: "/dashboard", active: true },
    { name: "Mentors", href: "/users" },
    { name: "Mentees", href: "/users" },
    { name: "Resources", href: "/resources" },
    { name: "Analytics", href: "/analytics" },
    { name: "Settings", href: "/settings" },
  ];

  const navLinks =
    role === "admin"
      ? adminLinks
      : role === "mentor"
        ? mentorLinks
        : menteeLinks;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#f9fafb]">
      <aside className="flex h-full w-64 shrink-0 flex-col justify-between border-r border-gray-200 bg-white">
        <div>
          <div className="flex justify-center border-b border-gray-100 p-6">
            <Image
              src="/logo.png"
              alt="Center for Adolescent Girls Health"
              width={180}
              height={60}
              className="object-contain"
              unoptimized
            />
          </div>

          <nav className="mt-6 flex flex-col gap-1 px-4 text-sm font-medium text-gray-700">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`rounded-md px-4 py-3 transition-colors ${
                  link.active
                    ? "bg-[#FDD028] font-semibold text-black"
                    : "hover:bg-gray-50"
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex flex-col gap-2 border-t border-gray-100 p-4 text-sm text-gray-600">
          {role === "mentor" && (
            <Link
              href="/support"
              className="rounded-md px-4 py-2 hover:bg-gray-50"
            >
              Support
            </Link>
          )}

          <Link
            href="/settings"
            className="rounded-md px-4 py-2 hover:bg-gray-50"
          >
            Settings
          </Link>

          <Link
            href="/api/auth/signout"
            className="rounded-md px-4 py-2 text-red-600 hover:bg-gray-50"
          >
            Logout
          </Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-20 shrink-0 items-center justify-between bg-[#f9fafb] px-8">
          <div className="flex items-center gap-6 text-sm font-semibold text-[#194611]">
            {role === "mentor" && (
              <>
                <Link href="/messaging" className="hover:underline">
                  Direct Messages
                </Link>
                <Link href="/resources" className="hover:underline">
                  Resource Library
                </Link>
              </>
            )}
          </div>

          <div className="flex items-center gap-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search mentees, resources..."
                className="w-72 rounded-full border border-gray-200 py-2.5 pl-10 pr-4 text-sm focus:border-[#194611] focus:outline-none"
              />
            </div>

            <Bell className="h-5 w-5 cursor-pointer text-gray-600 hover:text-[#194611]" />

            <button
              type="button"
              className="flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
            >
              <AlertCircle className="h-4 w-4" />
              Emergency Support
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  );
}
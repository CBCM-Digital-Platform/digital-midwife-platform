import { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Bell, Search, AlertCircle, LogOut, Settings, HelpCircle } from "lucide-react";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  // 1. Get the securely logged-in user and their role
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role || "mentee"; // Defaults to mentee for safety
  const userName = session?.user?.name || "User";

  // 2. Define the exact sidebar links based on the provided UI templates
  const mentorLinks = [
    { name: "Dashboard", href: "/dashboard", active: true }, // Using active: true for this example
    { name: "Mentees", href: "/mentees" },
    { name: "Facilities", href: "/facilities" },
    { name: "Assignments", href: "/assignments" },
    { name: "Resources", href: "/resources" },
    { name: "Clinical Assistant", href: "/ai-assistant" },
    { name: "Sessions", href: "/sessions" },
  ];

  const menteeLinks = [
    { name: "Dashboard", href: "/dashboard", active: true },
    { name: "Learning", href: "/learning" },
    { name: "Clinical Skills", href: "/clinical-skills" },
    { name: "Mentors", href: "/mentors" },
    { name: "Profile", href: "/profile" },
    { name: "Messages", href: "/messaging" },
    { name: "Progress", href: "/progress" },
    { name: "Clinical Assistant", href: "/ai-assistant" },
  ];

  const adminLinks = [
    { name: "Dashboard", href: "/dashboard", active: true },
    { name: "Mentors", href: "/users" },
    { name: "Mentees", href: "/users" },
    { name: "Resources", href: "/resources" },
    { name: "Analytics", href: "/analytics" },
    { name: "Settings", href: "/settings" },
  ];

  // Dynamically select the links based on the role
  const navLinks = role === "admin" ? adminLinks : role === "mentor" ? mentorLinks : menteeLinks;

  return (
    <div className="flex h-screen w-full bg-[#f9fafb]">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col justify-between h-full">
        <div>
          {/* Logo Section */}
          <div className="p-6 border-b border-gray-100 flex justify-center">
            {/* Make sure logo.png is saved in your public folder */}
            <Image 
                src="/logo.png" 
                alt="Center for Adolescent Girls Health" 
                width={180} 
                height={60} 
                className="object-contain" 
                unoptimized 
            />
          </div>

          {/* Dynamic Navigation */}
          <nav className="mt-6 flex flex-col gap-1 px-4 text-sm font-medium text-gray-700">
            {navLinks.map((link) => (
              <Link 
                key={link.name} 
                href={link.href}
                // Apply the secondary color (#FDD028) if the link is active based on the template design
                className={`px-4 py-3 rounded-md transition-colors ${
                  link.active ? "bg-[#FDD028] text-black font-semibold" : "hover:bg-gray-50"
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>
        </div>

        {/* Bottom Sidebar Links */}
        <div className="p-4 border-t border-gray-100 flex flex-col gap-2 text-sm text-gray-600">
          {role === "mentor" && (
             <Link href="/support" className="px-4 py-2 hover:bg-gray-50 rounded-md">Support</Link>
          )}
          <Link href="/settings" className="px-4 py-2 hover:bg-gray-50 rounded-md">Settings</Link>
          <Link href="/api/auth/signout" className="px-4 py-2 hover:bg-gray-50 rounded-md text-red-600">Logout</Link>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* TOP NAVIGATION BAR */}
        <header className="h-20 bg-[#f9fafb] flex items-center justify-between px-8">
          <div className="flex items-center gap-6 text-sm font-semibold text-[#194611]">
             {role === "mentor" && (
                <>
                  <Link href="/messaging" className="hover:underline">Direct Messages</Link>
                  <Link href="/resources" className="hover:underline">Resource Library</Link>
                </>
             )}
          </div>

          <div className="flex items-center gap-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search mentees, resources..." 
                className="pl-10 pr-4 py-2.5 rounded-full border border-gray-200 text-sm w-72 focus:outline-none focus:border-[#194611]"
              />
            </div>
            <Bell className="h-5 w-5 text-gray-600 cursor-pointer hover:text-[#194611]" />
            <button className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-red-700 transition">
              <AlertCircle className="h-4 w-4" /> Emergency Support
            </button>
          </div>
        </header>

        {/* DYNAMIC PAGE CONTENT INJECTED HERE */}
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
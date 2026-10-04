import Link from "next/link";
import { Bell, Search, AlertCircle } from "lucide-react";
import { UserRole } from "@/types/navigation";

interface HeaderProps {
  role: UserRole;
}

export function Header({ role }: HeaderProps) {
  return (
    <header className="h-20 bg-[#f9fafb] flex items-center justify-between px-8 border-b border-gray-100 shrink-0">
      <div className="flex items-center gap-6 text-sm font-semibold text-[#194611]">
        {role === "mentor" && (
          <>
            <Link href="/messages" className="hover:underline">
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search mentees, resources..."
            className="pl-10 pr-4 py-2.5 rounded-full border border-gray-200 text-sm w-72 focus:outline-none focus:border-[#194611] bg-white"
          />
        </div>
        <Bell className="h-5 w-5 text-gray-600 cursor-pointer hover:text-[#194611] transition" />
        <button className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-red-700 transition">
          <AlertCircle className="h-4 w-4" /> Emergency Support
        </button>
      </div>
    </header>
  );
}

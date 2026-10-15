import Link from "next/link";
import { Bell, AlertCircle } from "lucide-react";

interface HeaderProps {
  role?: string;
}

export function Header({ role }: HeaderProps) {
  const isMentor = (role || "").toLowerCase().includes("mentor");
  return (
    <header className="h-20 bg-[#f9fafb] flex items-center justify-between px-8 border-b border-gray-100 shrink-0">
      <div className="flex items-center gap-6 text-sm font-semibold text-[#194611]">
        {isMentor && (
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
        <Bell className="h-5 w-5 text-gray-600 cursor-pointer hover:text-[#194611] transition" />
        <button className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-red-700 transition cursor-pointer">
          <AlertCircle className="h-4 w-4" /> Emergency Support
        </button>
      </div>
    </header>
  );
}

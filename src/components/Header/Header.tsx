import Link from "next/link";
import { Bell, AlertCircle, Menu } from "lucide-react";

interface HeaderProps {
  role?: string;
  onToggleMobileMenu?: () => void;
}

export function Header({ role, onToggleMobileMenu }: HeaderProps) {
  const isMentor = (role || "").toLowerCase().includes("mentor");
  return (
    <header className="h-16 sm:h-20 bg-[#f9fafb] flex items-center justify-between px-4 sm:px-6 lg:px-8 border-b border-gray-100 shrink-0">
      <div className="flex items-center gap-3 sm:gap-6">
        {/* Mobile menu trigger button */}
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 -ml-1 text-gray-700 hover:text-[#194611] hover:bg-gray-100 rounded-lg transition cursor-pointer"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {isMentor && (
          <div className="hidden md:flex items-center gap-6 text-sm font-semibold text-[#194611]">
            <Link href="/messaging" className="hover:underline">
              Direct Messages
            </Link>
            <Link href="/resources" className="hover:underline">
              Resource Library
            </Link>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 sm:gap-6">
        <Bell className="h-5 w-5 text-gray-600 cursor-pointer hover:text-[#194611] transition" />
        <button className="flex items-center gap-1.5 sm:gap-2 bg-red-600 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium hover:bg-red-700 transition cursor-pointer shrink-0">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="hidden sm:inline">Emergency Support</span>
          <span className="sm:hidden">Emergency</span>
        </button>
      </div>
    </header>
  );
}

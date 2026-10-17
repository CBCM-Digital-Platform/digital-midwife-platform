import { ShieldCheck } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh">
      {/* Left panel: photo background with branding text on top */}
      <div className="relative hidden w-1/2 overflow-hidden lg:block">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/auth-background.jpg')" }}
        />
        <div className="absolute inset-0 bg-linear-to-br from-emerald-950/90 via-emerald-900/60 to-emerald-950/30" />

        <div className="relative z-10 flex h-full flex-col justify-end p-12 text-white">
          <div className="mb-4 flex items-center gap-2">
            <ShieldCheck className="h-6 w-6" />
            <span className="text-xl font-semibold">MidwifeConnect</span>
          </div>
          <p className="max-w-sm text-sm text-emerald-100">
            Professional Mentoring for Healthcare Practitioners. Enhancing
            clinical precision through unwavering support.
          </p>
        </div>
      </div>

      {/* Right panel: plain background, form card */}
      <div className="flex w-full items-center justify-center bg-[#faf7f4] px-4 py-8 sm:py-12 lg:w-1/2">
        {children}
      </div>
    </div>
  );
}
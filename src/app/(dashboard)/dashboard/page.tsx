import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  const userName = session?.user?.name || "User";

  if (role === "admin") {
    return (
      <div>
        <h1 className="text-3xl font-bold text-[#194611]">Admin Overview</h1>
        <p className="text-gray-500 mt-2">Manage users, resources, and system settings.</p>
      </div>
    );
  }

  if (role === "mentor") {
    return (
      <div className="max-w-6xl">
        <h1 className="text-3xl font-bold text-[#194611] mb-8">Welcome back, Midwife {userName.split(" ")[0]}</h1>

        <div className="grid grid-cols-4 gap-6 mb-8">
          {[
            { label: "TOTAL MENTEES", value: "6", trend: "+3 this month" },
            { label: "UPCOMING SESSIONS", value: "3", trend: null },
            { label: "PENDING ASSESSMENTS", value: "8", alert: "Needs Action" },
            { label: "AVG. COMPETENCY", value: "86%", trend: "+2%" }
          ].map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">{stat.label}</p>
              <div className="flex items-end justify-between">
                <p className="text-4xl font-bold text-gray-900">{stat.value}</p>
                {stat.trend && <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{stat.trend}</span>}
                {stat.alert && <span className="text-xs font-medium bg-red-50 text-red-600 px-2 py-1 rounded-full">{stat.alert}</span>}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-8">
          <div className="col-span-2 bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
                <button className="text-sm font-semibold text-[#194611]">View All</button>
             </div>
             <p className="text-sm text-gray-500">Activity feed will load here...</p>
          </div>

          <div className="col-span-1 bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
             <h2 className="text-xl font-semibold text-gray-900 mb-6">Today's Schedule</h2>
             <p className="text-sm text-gray-500">Timeline will load here...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl">
      <h1 className="text-3xl font-bold text-[#194611] mb-6">Welcome back, {userName.split(" ")[0]}!</h1>

      <div className="bg-[#194611] text-white p-8 rounded-2xl mb-8 flex justify-between items-center">
         <div>
            <p className="text-sm text-gray-300 mb-2">Active Clinical Pathway • Chapter 2 of 4</p>
            <h2 className="text-xl font-medium mb-4">You are currently completing Chapter 2: Intrapartum Care & Clinical Obstetric Skills.</h2>
            <div className="inline-flex items-center gap-4 text-sm bg-white/10 p-3 rounded-lg">
               <span>NEXT UP IN MODULE 4</span>
               <span className="font-semibold">Lesson 2: Fundal Height & Palpation Assessment (75% Complete)</span>
            </div>
         </div>
         <button className="bg-[#FDD028] text-black font-semibold px-6 py-3 rounded-lg hover:bg-yellow-400 transition">
            Resume Lesson
         </button>
      </div>
    </div>
  );
}
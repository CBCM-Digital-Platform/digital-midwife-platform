import Link from "next/link";
import { CalendarDays, UserRound } from "lucide-react";
import { getAssignedMentors } from "@/services/mentee.service";

export const metadata = {
  title: "My Mentor | Digital Midwife Mentorship Platform",
  description: "View the mentor assigned to your mentorship placement.",
};

export default async function MenteeMentorsPage() {
  const mentors = await getAssignedMentors();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">My Mentor</h1>
        <p className="mt-1 text-sm text-gray-600">
          Your active mentor assignments and the sessions scheduled with them.
        </p>
      </header>

      {mentors.length === 0 ? (
        <section className="rounded-xl border border-gray-200 bg-white p-8 text-center">
          <UserRound className="mx-auto h-9 w-9 text-gray-400" />
          <h2 className="mt-3 font-semibold text-gray-900">No mentor assigned yet</h2>
          <p className="mt-1 text-sm text-gray-600">
            Your facility administrator will assign a mentor to you.
          </p>
        </section>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {mentors.map((mentor) => (
            <section
              key={mentor.id}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <span className="rounded-full bg-emerald-50 p-3 text-emerald-800">
                  <UserRound className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="font-semibold text-gray-900">{mentor.name}</h2>
                  <p className="mt-1 text-sm capitalize text-gray-600">
                    {mentor.role?.replaceAll("_", " ") || "Assigned mentor"}
                  </p>
                </div>
              </div>
              <Link
                href="/mentee/sessions"
                className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-emerald-800 hover:underline"
              >
                <CalendarDays className="h-4 w-4" />
                View mentoring sessions
              </Link>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

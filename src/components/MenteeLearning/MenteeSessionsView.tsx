"use client";

import { useState } from "react";
import { CalendarDays, Clock3, MapPin, Video, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { joinSession, MenteeSessionItem } from "@/services/mentee.service";

interface MenteeSessionsViewProps {
  sessions: MenteeSessionItem[];
  loadError: string | null;
}

function formatScheduledAt(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date to be confirmed"
    : date.toLocaleString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
}

export function MenteeSessionsView({
  sessions,
  loadError,
}: MenteeSessionsViewProps) {
  const [joiningSessionId, setJoiningSessionId] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);

  const handleJoin = async (session: MenteeSessionItem) => {
    setJoinError(null);
    setJoiningSessionId(session.id);
    try {
      const { joinUrl } = await joinSession(session.id);
      window.open(joinUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      setJoinError(
        error instanceof Error ? error.message : "Could not join this session."
      );
    } finally {
      setJoiningSessionId(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">My Sessions</h1>
        <p className="mt-1 text-sm text-gray-600">
          Mentoring sessions scheduled by your assigned mentor.
        </p>
      </header>

      {loadError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">
          {loadError}
        </div>
      )}
      {joinError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">
          {joinError}
        </div>
      )}

      {!loadError && sessions.length === 0 ? (
        <section className="rounded-xl border border-gray-200 bg-white p-8 text-center">
          <CalendarDays className="mx-auto h-9 w-9 text-gray-400" />
          <h2 className="mt-3 font-semibold text-gray-900">No sessions scheduled</h2>
          <p className="mt-1 text-sm text-gray-600">
            Sessions scheduled by your mentor will appear here.
          </p>
        </section>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {sessions.map((session) => {
            const canJoin =
              session.mode !== "in_person" &&
              (session.status === "scheduled" || session.status === "in_progress");
            const isJoining = joiningSessionId === session.id;

            return (
              <article
                key={session.id}
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold text-gray-900">{session.title}</h2>
                    <p className="mt-1 text-sm text-gray-600">
                      With {session.mentorName}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium capitalize text-gray-700">
                    {session.status.replaceAll("_", " ")}
                  </span>
                </div>

                <div className="mt-4 space-y-2 text-sm text-gray-600">
                  <p className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 shrink-0" />
                    {formatScheduledAt(session.scheduledAt)}
                  </p>
                  <p className="flex items-center gap-2">
                    <Clock3 className="h-4 w-4 shrink-0" />
                    {session.durationMinutes} minutes
                  </p>
                  <p className="flex items-center gap-2 capitalize">
                    {session.mode === "in_person" ? (
                      <MapPin className="h-4 w-4 shrink-0" />
                    ) : (
                      <Video className="h-4 w-4 shrink-0" />
                    )}
                    {session.mode.replaceAll("_", " ")}
                    {session.clinicalSetting ? ` · ${session.clinicalSetting}` : ""}
                  </p>
                  {session.preparationNotes && (
                    <p className="pt-1">{session.preparationNotes}</p>
                  )}
                </div>

                {canJoin && (
                  <Button
                    className="mt-4"
                    onClick={() => void handleJoin(session)}
                    disabled={isJoining}
                  >
                    {isJoining ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Video className="mr-2 h-4 w-4" />
                    )}
                    Join session
                  </Button>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import ChatWindow from "@/components/Messaging/ChatWindow";
import { Suspense } from "react";

export default async function MessagingPage() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;

  return (
    <Suspense
      fallback={
        <div className="flex h-96 items-center justify-center rounded-xl border border-[#dce2d5] bg-white p-8 text-sm text-[#758071]">
          Loading messaging...
        </div>
      }
    >
      <ChatWindow role={role === "mentor" ? "mentor" : "mentee"} />
    </Suspense>
  );
}

import { getServerSession } from "next-auth/next";
import ChatWindow from "@/components/Messaging/ChatWindow";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export default async function MessagingPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;

  return <ChatWindow role={role === "mentor" ? "mentor" : "mentee"} />;
}
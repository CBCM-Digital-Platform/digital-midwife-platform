import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import ChatWindow from "@/components/Messaging/ChatWindow";

export default async function MessagingPage() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;

  return <ChatWindow role={role === "mentor" ? "mentor" : "mentee"} />;
}

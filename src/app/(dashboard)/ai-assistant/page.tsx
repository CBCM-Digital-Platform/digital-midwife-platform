import { AssistantChat } from "@/components/AiAssistant/AssistantChat";
import { getAssistantData } from "@/services/clinical-assistant.service";

export default async function AiAssistantPage() {
  const data = await getAssistantData();
  return <AssistantChat data={data} />;
}
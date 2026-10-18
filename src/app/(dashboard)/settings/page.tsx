import SettingsView from "@/components/Settings/SettingsView";
import { getProfileData } from "@/services/settings-data.service";

export default async function SettingsPage() {
  const data = await getProfileData();
  return <SettingsView data={data} />;
}
import { ResourceLibraryView } from "@/components/ResourceLibrary/ResourceLibraryView";
import { getResources } from "@/services/resource-library.service";

export default async function ResourcesPage() {
  const resources = await getResources();
  return <ResourceLibraryView resources={resources} />;
}
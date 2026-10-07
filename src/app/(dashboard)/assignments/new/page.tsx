import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import AddAssignmentForm from "@/components/Assignment/AddAssignmentForm";
import { getAssignmentFormOptions } from "@/services/assignment-form.service";

export default async function NewAssignmentPage() {
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string } | undefined)?.role;

    // Only admins can create assignments.
    if (role !== "admin") redirect("/dashboard");

    const options = await getAssignmentFormOptions();

    return <AddAssignmentForm options={options} />;
}
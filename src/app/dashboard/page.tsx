import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import FileUploader from "@/components/FileUploader";

export default async function DashboardPage() {
    const { userId } = await auth();
    if (!userId) {
        redirect("/sign-in");
    }
    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">
                Welcome to your Dashboard!
            </h1>
            <FileUploader />
        </div>
    );
}
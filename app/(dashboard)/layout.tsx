import { ReactNode } from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Sidebar from "./components/Sidebar";
import ClerkConfigNotice from "@/components/auth/ClerkConfigNotice";

const clerkConfigured = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim() &&
    process.env.CLERK_SECRET_KEY?.trim()
);

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  if (!clerkConfigured) {
    return (
      <ClerkConfigNotice
        title="Dashboard authentication is unavailable."
        detail="This deployment is missing the Clerk environment variables required to protect dashboard routes."
      />
    );
  }

  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="flex h-screen w-full bg-green-300 dark:bg-background-dark overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 h-full relative min-w-0 overflow-hidden">
        {children}
      </div>
    </div>
  );
}

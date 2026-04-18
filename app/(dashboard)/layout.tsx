import { ReactNode } from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Sidebar from "./components/Sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
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

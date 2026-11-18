
export const instant = false;

import { connection } from "next/server";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth/session";
import MainLayout from "@/components/layout/MainLayout";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await connection();

  const admin = await getCurrentAdmin();

  if (!admin) {
    redirect("/login");
  }

  return (
    <MainLayout admin={admin}>
      {children}
    </MainLayout>
  );
}

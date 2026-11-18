export const instant = false;

import { connection } from "next/server";

import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth/session";
import LoginForm from "@/components/auth/LoginForm";
import { ShieldCheck } from "lucide-react";

export default async function LoginPage() {
  await connection();
  const admin = await getCurrentAdmin();

  if (admin) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f7fb] px-5 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#15406A] text-white shadow-lg shadow-[#15406A]/20">
            <ShieldCheck size={32} strokeWidth={1.8} />
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-[#172b42]">Monitoring Tindak Lanjut Kinerja</h1>

          <p className="mt-2 text-sm text-slate-500">Silakan masuk menggunakan akun Administrator.</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm sm:p-8">
          <div className="mb-7">
            <h2 className="text-lg font-semibold text-slate-800">Login Administrator</h2>

            <p className="mt-1 text-sm text-slate-500">Masukkan email dan password akun Anda.</p>
          </div>

          <LoginForm />
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">Sistem Monitoring Tindak Lanjut Kinerja</p>
      </div>
    </main>
  );
}

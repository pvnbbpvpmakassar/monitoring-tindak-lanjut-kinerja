
import { ShieldCheck } from "lucide-react";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-white">
          <ShieldCheck size={32} />
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-primary">
          Monitoring Tindak Lanjut Kinerja
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-500">
          Sistem informasi untuk memantau tindak lanjut temuan,
          rekomendasi, dan status verifikasi.
        </p>

        <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-green-50 px-4 py-2 text-xs font-medium text-green-700">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          Project berhasil diinisialisasi
        </div>
      </div>
    </main>
  );
}

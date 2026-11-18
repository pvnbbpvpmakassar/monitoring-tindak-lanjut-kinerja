import { connection } from "next/server";
import type { ReactNode } from "react";

import { ArrowDownRight, ArrowUpRight, ClipboardList, Wallet, ChevronDown, FileText, MessageSquareText } from "lucide-react";

import SuratTugasForm from "@/components/tindak-lanjut/SuratTugasForm";
import TambahTemuanModal from "@/components/tindak-lanjut/TambahTemuanModal";
import YearFilter from "@/components/tindak-lanjut/YearFilter";

import { getSuratTugasByYear, getTindakLanjutByYear } from "@/lib/db/queries";

export const instant = false;

interface PageProps {
  searchParams: Promise<{
    tahun?: string | string[];
  }>;
}

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function TindakLanjutPage({ searchParams }: PageProps) {
  await connection();

  const params = await searchParams;
  const currentYear = new Date().getFullYear();

  const rawYear = Array.isArray(params.tahun) ? params.tahun[0] : params.tahun;

  const parsedYear = Number(rawYear);

  const selectedYear = rawYear && Number.isInteger(parsedYear) && parsedYear >= 2020 && parsedYear <= 2030 ? parsedYear : currentYear;

  const [suratTugas, data] = await Promise.all([getSuratTugasByYear(selectedYear), getTindakLanjutByYear(selectedYear)]);

  const totalTemuan = data.length;

  const totalNilaiTemuan = data.reduce((total, item) => total + item.nilai_temuan, 0);

  const totalSetor = data.reduce((total, item) => total + item.jumlah_setor, 0);

  const totalSisa = data.reduce((total, item) => total + Math.max(item.sisa, 0), 0);

  return (
    <div className="space-y-6">
      {/* Page Heading */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-slate-400">
            <span>Dashboard</span>
            <span>/</span>
            <span className="font-medium text-[#15406A]">Tindak Lanjut</span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-800">Tindak Lanjut Temuan</h1>

          <p className="mt-1 text-sm text-slate-500">Kelola temuan, tindak lanjut, dan status verifikasi.</p>
        </div>

        <YearFilter selectedYear={selectedYear} />
      </div>

      {/* Surat Tugas */}
      <SuratTugasForm key={selectedYear} tahun={selectedYear} nomorSurat={suratTugas?.nomor_surat ?? ""} />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard title="Total Temuan" value={totalTemuan.toLocaleString("id-ID")} description={`Temuan tahun ${selectedYear}`} icon={<ClipboardList size={20} />} iconClass="bg-blue-50 text-blue-700" />

        <SummaryCard title="Nilai Temuan" value={formatRupiah(totalNilaiTemuan)} description="Total nilai seluruh temuan" icon={<Wallet size={20} />} iconClass="bg-amber-50 text-amber-700" />

        <SummaryCard title="Jumlah Setor" value={formatRupiah(totalSetor)} description="Total penyetoran tindak lanjut" icon={<ArrowDownRight size={20} />} iconClass="bg-emerald-50 text-emerald-700" />

        <SummaryCard title="Sisa Kewajiban" value={formatRupiah(totalSisa)} description="Nilai yang masih harus ditindaklanjuti" icon={<ArrowUpRight size={20} />} iconClass="bg-rose-50 text-rose-700" />
      </div>

      {/* Daftar Temuan */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Header */}
        <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-slate-800">Daftar Temuan</h2>

            <p className="mt-1 text-sm text-slate-500">Data temuan dan progres tindak lanjut tahun {selectedYear}.</p>
          </div>

          <TambahTemuanModal tahun={selectedYear} hasSuratTugas={Boolean(suratTugas)} />
        </div>

        {/* Daftar Card */}
        {data.length === 0 ? (
          <div className="flex flex-col items-center px-5 py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <ClipboardList size={26} />
            </div>

            <h3 className="font-semibold text-slate-700">Belum ada data temuan</h3>

            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">Belum terdapat temuan yang tercatat untuk tahun {selectedYear}. Data akan muncul di sini setelah temuan ditambahkan.</p>
          </div>
        ) : (
          <div className="space-y-4 bg-slate-50/60 p-4 sm:p-5">
            {data.map((item, index) => (
              <article key={item.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:border-slate-300 hover:shadow-md">
                {/* Card Header */}
                <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#15406A]/5 text-sm font-bold text-[#15406A]">{String(index + 1).padStart(2, "0")}</div>

                    <div></div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <StatusBadge status={item.status_tindak_lanjut} />

                    <VerificationBadge status={item.status_verifikasi} />
                  </div>
                </div>

                {/* Card Body */}
                <div className="space-y-5 p-4 sm:p-5">
                  {/* Kondisi Temuan */}
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <FileText size={16} className="text-[#15406A]" />

                      <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Kondisi Temuan</h4>
                    </div>

                    <p className="whitespace-pre-line text-sm leading-6 text-slate-700">{item.kondisi}</p>
                  </div>

                  {/* Financial Summary */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <FinancialItem label="Nilai Temuan" value={formatRupiah(item.nilai_temuan)} />

                    <FinancialItem label="Jumlah Setor" value={formatRupiah(item.jumlah_setor)} valueClass="text-emerald-700" />

                    <FinancialItem label="Sisa Kewajiban" value={formatRupiah(Math.max(item.sisa, 0))} valueClass={item.sisa > 0 ? "text-rose-600" : "text-emerald-700"} />

                    <FinancialItem
                      label="Progres Penyetoran"
                      value={`${item.nilai_temuan > 0 ? Math.min((item.jumlah_setor / item.nilai_temuan) * 100, 100).toFixed(1) : item.jumlah_setor > 0 ? "100.0" : "0.0"}%`}
                      showProgress
                      progress={item.nilai_temuan > 0 ? Math.min((item.jumlah_setor / item.nilai_temuan) * 100, 100) : item.jumlah_setor > 0 ? 100 : 0}
                    />
                  </div>

                  {/* Expandable Details */}
                  <details className="group border-t border-slate-100 pt-4">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-lg py-2 transition hover:bg-slate-50 [&::-webkit-details-marker]:hidden">
                      <div className="flex items-center gap-2">
                        <MessageSquareText size={17} className="text-[#15406A]" />

                        <span className="text-sm font-semibold text-[#15406A]">Lihat Rekomendasi dan Aksi Tindak Lanjut</span>
                      </div>

                      <ChevronDown size={18} className="shrink-0 text-slate-400 transition-transform duration-200 group-open:rotate-180" />
                    </summary>

                    <div className="grid grid-cols-1 gap-4 pt-4 lg:grid-cols-2">
                      {/* Rekomendasi */}
                      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                        <div className="mb-3 flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[#15406A]">
                            <ClipboardList size={16} />
                          </div>

                          <h4 className="text-sm font-semibold text-slate-700">Rekomendasi</h4>
                        </div>

                        {item.rekomendasi ? (
                          <div
                            className="text-sm leading-7 text-slate-600 [&_blockquote]:my-3 [&_blockquote]:border-l-4 [&_blockquote]:border-slate-300 [&_blockquote]:pl-3 [&_h2]:mb-2 [&_h2]:mt-4 [&_h2]:text-base [&_h2]:font-semibold [&_li]:ml-5 [&_ol]:my-2 [&_ol]:list-decimal [&_p]:mb-2 [&_ul]:my-2 [&_ul]:list-disc [&_strong]:font-semibold"
                            dangerouslySetInnerHTML={{
                              __html: item.rekomendasi,
                            }}
                          />
                        ) : (
                          <p className="text-sm italic text-slate-400">Belum ada rekomendasi.</p>
                        )}
                      </div>

                      {/* Aksi Tindak Lanjut */}
                      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                        <div className="mb-3 flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                            <ArrowDownRight size={16} />
                          </div>

                          <h4 className="text-sm font-semibold text-slate-700">Aksi Tindak Lanjut</h4>
                        </div>

                        {item.aksi_tindak_lanjut ? <p className="whitespace-pre-line text-sm leading-7 text-slate-600">{item.aksi_tindak_lanjut}</p> : <p className="text-sm italic text-slate-400">Belum ada aksi tindak lanjut.</p>}
                      </div>
                    </div>
                  </details>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-slate-100 px-5 py-4">
          <p className="text-xs text-slate-400">
            Menampilkan {data.length} data temuan untuk tahun {selectedYear}.
          </p>
        </div>
      </div>
    </div>
  );
}

/* Summary Card */
function SummaryCard({ title, value, description, icon, iconClass }: { title: string; value: string; description: string; icon: ReactNode; iconClass: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>

          <p className="mt-3 break-words text-xl font-bold tracking-tight text-slate-800">{value}</p>
        </div>

        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClass}`}>{icon}</div>
      </div>

      <p className="mt-3 text-xs text-slate-400">{description}</p>
    </div>
  );
}

/* Financial Item */
function FinancialItem({ label, value, valueClass = "text-slate-800", showProgress = false, progress = 0 }: { label: string; value: string; valueClass?: string; showProgress?: boolean; progress?: number }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
      <p className="text-xs font-medium text-slate-500">{label}</p>

      <p className={`mt-2 break-words text-base font-bold ${valueClass}`}>{value}</p>

      {showProgress && (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-[#15406A] transition-all duration-500"
            style={{
              width: `${Math.max(0, Math.min(progress, 100))}%`,
            }}
          />
        </div>
      )}
    </div>
  );
}

/* Status Badge */
function StatusBadge({ status }: { status: string }) {
  const isDone = status === "Sudah Ditindak Lanjut";

  return <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${isDone ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{status}</span>;
}

/* Verification Badge */
function VerificationBadge({ status }: { status: "Sesuai" | "Belum Sesuai" | null }) {
  if (!status) {
    return <span className="inline-flex whitespace-nowrap rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">Belum Diverifikasi</span>;
  }

  return <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${status === "Sesuai" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>{status}</span>;
}

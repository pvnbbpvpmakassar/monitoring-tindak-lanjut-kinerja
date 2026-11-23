import { connection } from "next/server";
import type { ReactNode } from "react";
import EditTemuanModal from "@/components/tindak-lanjut/EditTemuanModal";
import HapusTemuanButton from "@/components/tindak-lanjut/HapusTemuanButton";
import TindakLanjutButton from "@/components/tindak-lanjut/TindakLanjutButton";
import EditTindakLanjutModal from "@/components/tindak-lanjut/EditTindakLanjutModal";
import HapusTindakLanjutButton from "@/components/tindak-lanjut/HapusTindakLanjutButton";
import BuktiDukungList from "@/components/tindak-lanjut/BuktiDukungList";
import VerificationStatusSelect from "@/components/tindak-lanjut/VerificationStatusSelect";

import { ArrowDownRight, ArrowUpRight, ClipboardList, Wallet, FileText } from "lucide-react";

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

  const totalSetor = data.reduce((total, item) => total + item.total_setor, 0);

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
          <div className="space-y-5 bg-slate-50/60 p-4 sm:p-5">
            {data.map((item, index) => (
              <div key={item.id} className="space-y-3">
                {/* Identitas Temuan dan Aksi */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#15406A] text-sm font-bold text-white">{String(index + 1).padStart(2, "0")}</div>

                    <div>
                      <h3 className="text-sm font-bold text-slate-800">Temuan {String(index + 1)}</h3>

                      <p className="text-xs text-slate-400">Tahun Anggaran {selectedYear}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <EditTemuanModal id={item.id} kondisi={item.kondisi} rekomendasi={item.rekomendasi} nilaiTemuan={item.nilai_temuan} />

                    <HapusTemuanButton id={item.id} nomorTemuan={`Temuan #${String(index + 1).padStart(3, "0")}`} />
                  </div>
                </div>

                {/* Tiga Card Utama */}
                <div className="grid grid-cols-1 items-stretch gap-3 xl:grid-cols-12">
                  {/* CARD 1: INFORMASI TEMUAN */}
                  <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-5">
                    <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-[#15406A]">
                        <FileText size={18} />
                      </div>

                      <div>
                        <h4 className="text-sm font-bold text-slate-800">Informasi Temuan</h4>
                        <p className="text-xs text-slate-400">Kondisi, rekomendasi, dan nilai temuan</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">Kondisi Temuan</p>
                        <p className="whitespace-pre-line text-sm leading-6 text-slate-700">{item.kondisi}</p>
                      </div>

                      <div className="border-t border-slate-100 pt-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Rekomendasi</p>

                        {item.rekomendasi ? (
                          <div
                            className="text-sm leading-6 text-slate-600 [&_blockquote]:my-2 [&_blockquote]:border-l-4 [&_blockquote]:border-slate-300 [&_blockquote]:pl-3 [&_h2]:mb-2 [&_h2]:mt-3 [&_h2]:font-semibold [&_li]:ml-5 [&_ol]:my-2 [&_ol]:list-decimal [&_p]:mb-2 [&_ul]:my-2 [&_ul]:list-disc [&_strong]:font-semibold"
                            dangerouslySetInnerHTML={{
                              __html: item.rekomendasi,
                            }}
                          />
                        ) : (
                          <p className="text-sm italic text-slate-400">Belum ada rekomendasi.</p>
                        )}
                      </div>

                      <div className="rounded-lg bg-blue-50/70 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Nilai Temuan</p>
                        <p className="mt-1 text-xl font-bold tracking-tight text-[#15406A]">{formatRupiah(item.nilai_temuan)}</p>
                      </div>
                    </div>
                  </section>

                  {/* CARD 2: TINDAK LANJUT */}
                  <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-4">
                    <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                        <ClipboardList size={18} />
                      </div>

                      <div>
                        <h4 className="text-sm font-bold text-slate-800">Tindak Lanjut</h4>
                        <p className="text-xs text-slate-400">Aksi dan realisasi penyetoran</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {item.reports.length === 0 ? (
                        <p className="text-sm italic text-slate-400">Belum ada laporan tindak lanjut.</p>
                      ) : (
                        item.reports.map((report, reportIndex) => (
                          <div key={report.id} className="rounded-xl border border-slate-200 p-3.5">
                            <div className="mb-3 flex items-center justify-between">
                              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Laporan {reportIndex + 1}</p>
                              <div className="flex items-center gap-2"><EditTindakLanjutModal laporanId={report.id} kondisi={item.kondisi} nilaiTemuan={item.nilai_temuan} totalSetor={item.total_setor} aksi={report.aksi_tindak_lanjut} jumlahSetor={report.jumlah_setor} /><HapusTindakLanjutButton laporanId={report.id} laporanLabel={`Laporan ${reportIndex + 1}`} /></div>
                            </div>
                            <div>
                              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">Aksi Tindak Lanjut</p>
                              <p className="whitespace-pre-line text-sm leading-6 text-slate-700">{report.aksi_tindak_lanjut}</p>
                            </div>
                            <div className="mt-3 border-t border-slate-100 pt-3">
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Jumlah Setor</p>
                              <p className="mt-1 text-base font-bold text-emerald-700">{formatRupiah(report.jumlah_setor)}</p>
                            </div>
                            <BuktiDukungList key={report.id} laporanId={report.id} />
                          </div>
                        ))
                      )}

                      <div className="rounded-lg bg-emerald-50/70 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Seluruh Setoran</p>
                        <p className="mt-1 text-lg font-bold text-emerald-700">{formatRupiah(item.total_setor)}</p>
                      </div>

                      <div className="rounded-lg bg-rose-50/70 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Sisa Kewajiban</p>
                        <p className="mt-1 text-xl font-bold text-rose-600">{formatRupiah(Math.max(item.sisa, 0))}</p>
                      </div>

                      <div>
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-xs font-medium text-slate-500">Progres Penyetoran</span>
                          <span className="text-xs font-bold text-slate-700">{item.nilai_temuan > 0 ? Math.min((item.total_setor / item.nilai_temuan) * 100, 100).toFixed(1) : item.total_setor > 0 ? "100.0" : "0.0"}%</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${item.nilai_temuan > 0 ? Math.min((item.total_setor / item.nilai_temuan) * 100, 100) : item.total_setor > 0 ? 100 : 0}%` }} />
                        </div>
                      </div>
                    </div>

                    <div className="m-4 flex justify-end">
                      <TindakLanjutButton temuanId={item.id} kondisi={item.kondisi} nilaiTemuan={item.nilai_temuan} totalSetor={item.total_setor} />
                    </div>
                  </section>

                  {/* CARD 3: STATUS */}

                  {/* CARD 3: STATUS TINDAK LANJUT DARI KABAG UMUM */}
                  <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-3">
                    <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 text-violet-700">
                        <ClipboardList size={18} />
                      </div>

                      <div>
                        <h4 className="text-sm font-bold text-slate-800">Status Tindak Lanjut dari Kabag Umum</h4>

                        <p className="text-xs text-slate-400">Progres dan verifikasi</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {item.reports.length === 0 ? (
                        <div>
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Status Tindak Lanjut</p>
                          <StatusBadge status="Belum Ditindak Lanjut" />
                        </div>
                      ) : item.reports.map((report, reportIndex) => (
                        <div key={report.id} className="rounded-xl border border-slate-200 p-3.5">
                          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">Laporan {reportIndex + 1}</p>
                          <div>
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Status Tindak Lanjut</p>
                            <StatusBadge status="Sudah Ditindak Lanjut" />
                          </div>
                          <div className="mt-4 border-t border-slate-100 pt-3">
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Status Verifikasi Kabag Umum</p>
                            <VerificationStatusSelect laporanId={report.id} status={report.status_verifikasi} tanggalVerifikasi={report.tanggal_verifikasi} diverifikasiOlehNama={report.diverifikasi_oleh_nama} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              </div>
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
function VerificationBadge({ status }: { status: "Sesuai" | "Tidak Sesuai" | null }) {
  if (!status) {
    return <span className="text-sm text-slate-400">—</span>;
  }

  return <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${status === "Sesuai" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>{status}</span>;
}

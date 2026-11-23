"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Save, UploadCloud, FileText, Image as ImageIcon, Trash2, LoaderCircle, Plus, MinusCircle } from "lucide-react";
import { saveTindakLanjutAction } from "@/actions/tindak-lanjut";

interface TindakLanjutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  temuanId: string;
  kondisi: string;
  nilaiTemuan: number;
  totalSetor: number;
}

interface ReportForm {
  key: string;
  aksi: string;
  jumlahSetor: string;
  files: File[];
}

const MAX_FILE_SIZE = 4 * 1024 * 1024;
const MAX_FILES = 10;
const MAX_REPORTS = 20;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 2 }).format(value);
}

function createReport(): ReportForm {
  return { key: crypto.randomUUID(), aksi: "", jumlahSetor: "0", files: [] };
}

export default function TindakLanjutModal({ isOpen, onClose, onSuccess, temuanId, kondisi, nilaiTemuan, totalSetor }: TindakLanjutModalProps) {
  const [reports, setReports] = useState<ReportForm[]>(() => [createReport()]);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  const totalBaru = useMemo(
    () =>
      reports.reduce((total, report) => {
        const amount = Number(report.jumlahSetor || 0);
        return total + (Number.isFinite(amount) ? amount : 0);
      }, 0),
    [reports],
  );
  const sisaSetelahInput = nilaiTemuan - totalSetor - totalBaru;

  if (!isOpen) return null;

  function updateReport(key: string, changes: Partial<ReportForm>) {
    setReports((previous) => previous.map((report) => (report.key === key ? { ...report, ...changes } : report)));
  }

  function handleFileChange(key: string, event: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    const valid: File[] = [];
    let error = "";

    for (const file of selected) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        error = `${file.name}: format file tidak didukung.`;
      } else if (file.size === 0 || file.size > MAX_FILE_SIZE) {
        error = `${file.name}: ukuran file harus antara 1 byte sampai 4 MB.`;
      } else {
        valid.push(file);
      }
    }

    setReports((previous) =>
      previous.map((report) => {
        if (report.key !== key) return report;
        const combined = [...report.files, ...valid];
        if (combined.length > MAX_FILES) error = `Maksimal ${MAX_FILES} file untuk setiap laporan.`;
        return { ...report, files: combined.slice(0, MAX_FILES) };
      }),
    );
    setMessage(error);
    event.target.value = "";
  }

  function removeFile(key: string, index: number) {
    setReports((previous) => previous.map((report) => (report.key === key ? { ...report, files: report.files.filter((_, fileIndex) => fileIndex !== index) } : report)));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;
    setMessage("");

    for (let index = 0; index < reports.length; index++) {
      if (!reports[index].aksi.trim()) {
        setMessage(`Aksi tindak lanjut pada form ${index + 1} wajib diisi.`);
        return;
      }
      const amount = reports[index].jumlahSetor;
      if (!/^(?:0|[1-9]\d{0,17})(?:\.\d{1,2})?$/.test(amount) || !Number.isFinite(Number(amount)) || Number(amount) < 0) {
        setMessage(`Jumlah setor pada form ${index + 1} tidak valid.`);
        return;
      }
    }

    if (totalSetor + totalBaru > nilaiTemuan) {
      setMessage(`Total setoran melebihi nilai temuan. Sisa kewajiban yang tersedia ${formatRupiah(Math.max(0, nilaiTemuan - totalSetor))}.`);
      return;
    }

    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.set("temuanId", temuanId);
      formData.set("reports", JSON.stringify(reports.map(({ aksi, jumlahSetor }) => ({ aksiTindakLanjut: aksi, jumlahSetor }))));

      const result = await saveTindakLanjutAction({ status: "idle", message: "", laporanId: null }, formData);
      if (result.status !== "success" || !result.laporanIds?.length) {
        throw new Error(result.message || "Gagal menyimpan tindak lanjut.");
      }

      let failedUploads = 0;
      for (let index = 0; index < reports.length; index++) {
        const laporanId = result.laporanIds[index];
        for (const file of reports[index].files) {
          try {
            const uploadData = new FormData();
            uploadData.append("file", file);
            uploadData.append("laporanId", laporanId);
            const response = await fetch("/api/bukti-dukung", { method: "POST", body: uploadData });
            const uploadResult = await response.json();
            if (!response.ok || !uploadResult.success) throw new Error(uploadResult.message || "Upload file gagal.");
          } catch (error) {
            failedUploads++;
            console.error(`Upload ${file.name} gagal:`, error);
          }
        }
      }

      onSuccess(failedUploads > 0 ? `${result.laporanIds.length} laporan tersimpan. ${failedUploads} file bukti dukung gagal diunggah.` : `${result.laporanIds.length} laporan tindak lanjut dan seluruh bukti dukung berhasil disimpan.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Terjadi kesalahan saat menyimpan data.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.button
          type="button"
          aria-label="Tutup modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          disabled={isSaving}
          className="fixed inset-0 cursor-default bg-slate-950/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.98 }}
          transition={{ duration: 0.2 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="tindak-lanjut-modal-title"
          className="relative z-10 flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
            <div>
              <h2 id="tindak-lanjut-modal-title" className="text-lg font-bold text-slate-800">
                Tambah Tindak Lanjut
              </h2>
              <p className="mt-1 text-sm text-slate-500">Satu temuan dapat memiliki beberapa laporan tindak lanjut.</p>
            </div>
            <button type="button" onClick={onClose} disabled={isSaving} className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50" aria-label="Tutup modal">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 overflow-y-auto px-6 py-5">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Informasi Temuan</p>
              <p className="mt-2 whitespace-pre-line text-sm font-medium leading-relaxed text-slate-700">{kondisi}</p>
              <div className="mt-3 grid grid-cols-1 gap-3 border-t border-slate-200 pt-3 sm:grid-cols-3">
                <div>
                  <p className="text-xs text-slate-500">Nilai Temuan</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">{formatRupiah(nilaiTemuan)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Setoran Sebelumnya</p>
                  <p className="mt-1 text-sm font-semibold text-emerald-700">{formatRupiah(totalSetor)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Sisa Kewajiban</p>
                  <p className="mt-1 text-sm font-semibold text-amber-700">{formatRupiah(Math.max(0, nilaiTemuan - totalSetor))}</p>
                </div>
              </div>
            </div>

            {reports.map((report, index) => (
              <section key={report.key} className="rounded-xl border border-slate-200 p-4 sm:p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-800">Laporan Tindak Lanjut {index + 1}</h3>
                  {reports.length > 1 && (
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() => setReports((previous) => previous.filter((item) => item.key !== report.key))}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-600 hover:text-rose-700"
                    >
                      <MinusCircle size={15} /> Hapus form
                    </button>
                  )}
                </div>

                <div>
                  <label htmlFor={`aksi-${report.key}`} className="mb-2 block text-sm font-semibold text-slate-700">
                    Aksi Tindak Lanjut <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id={`aksi-${report.key}`}
                    value={report.aksi}
                    onChange={(event) => updateReport(report.key, { aksi: event.target.value })}
                    rows={4}
                    maxLength={30000}
                    required
                    disabled={isSaving}
                    placeholder="Tuliskan uraian tindakan yang telah dilakukan..."
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#15406A] focus:ring-2 focus:ring-[#15406A]/10"
                  />
                  <p className="mt-1 text-right text-xs text-slate-400">{report.aksi.length.toLocaleString("id-ID")} / 30.000 karakter</p>
                </div>

                <div className="mt-4">
                  <label htmlFor={`setor-${report.key}`} className="mb-2 block text-sm font-semibold text-slate-700">
                    Jumlah Setor (Rp) <span className="text-red-500">*</span>
                  </label>
                  <input
                    id={`setor-${report.key}`}
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={report.jumlahSetor}
                    disabled={isSaving}
                    onChange={(event) => updateReport(report.key, { jumlahSetor: event.target.value })}
                    placeholder="Masukkan jumlah setor"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#15406A] focus:ring-2 focus:ring-[#15406A]/10"
                  />
                </div>

                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-sm font-semibold text-slate-700">Bukti Dukung</label>
                    <span className="text-xs text-slate-400">Maks. 10 file, 4 MB/file</span>
                  </div>
                  <label
                    htmlFor={`files-${report.key}`}
                    className={`flex w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center transition hover:border-[#15406A] hover:bg-blue-50 ${isSaving || report.files.length >= MAX_FILES ? "pointer-events-none opacity-50" : ""}`}
                  >
                    <UploadCloud size={25} className="mb-2 text-[#15406A]" />
                    <span className="text-sm font-semibold text-slate-700">Pilih file bukti dukung</span>
                    <span className="mt-1 text-xs text-slate-400">JPG, PNG, WEBP, atau PDF</span>
                  </label>
                  <input
                    id={`files-${report.key}`}
                    type="file"
                    multiple
                    accept=".jpg,.jpeg,.png,.webp,.pdf"
                    disabled={isSaving || report.files.length >= MAX_FILES}
                    onChange={(event) => handleFileChange(report.key, event)}
                    className="hidden"
                  />
                  {report.files.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {report.files.map((file, fileIndex) => (
                        <div key={`${file.name}-${file.size}-${fileIndex}`} className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2">
                          {file.type === "application/pdf" ? <FileText size={19} className="shrink-0 text-red-500" /> : <ImageIcon size={19} className="shrink-0 text-blue-500" />}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-slate-700">{file.name}</p>
                            <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
                          </div>
                          <button type="button" onClick={() => removeFile(report.key, fileIndex)} disabled={isSaving} className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600" aria-label={`Hapus ${file.name}`}>
                            <Trash2 size={15} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            ))}

            <button
              type="button"
              disabled={isSaving || reports.length >= MAX_REPORTS}
              onClick={() => setReports((previous) => [...previous, createReport()])}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#15406A]/40 bg-blue-50/50 px-4 py-3 text-sm font-semibold text-[#15406A] transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus size={17} /> Tambah Form Tindak Lanjut
            </button>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-slate-500">Total setoran pada form ini</span>
                <strong className="text-[#15406A]">{formatRupiah(totalBaru)}</strong>
              </div>
              <div className="mt-2 flex items-center justify-between gap-3 text-sm">
                <span className="text-slate-500">Sisa kewajiban setelah disimpan</span>
                <strong className={sisaSetelahInput < 0 ? "text-rose-600" : "text-emerald-700"}>{formatRupiah(sisaSetelahInput)}</strong>
              </div>
            </div>

            {message && (
              <div role="alert" aria-live="polite" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {message}
              </div>
            )}

            <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
              <button type="button" onClick={onClose} disabled={isSaving} className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50">
                Batal
              </button>
              <button
                type="submit"
                disabled={isSaving || sisaSetelahInput < 0}
                className="flex items-center gap-2 rounded-xl bg-[#15406A] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#103454] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? (
                  <>
                    <LoaderCircle size={17} className="animate-spin" /> Menyimpan...
                  </>
                ) : (
                  <>
                    <Save size={17} /> Simpan {reports.length} Laporan
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

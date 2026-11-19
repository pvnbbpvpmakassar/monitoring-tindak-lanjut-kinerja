"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Save, UploadCloud, FileText, Image as ImageIcon, Trash2, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { saveTindakLanjutAction } from "@/actions/tindak-lanjut";

interface TindakLanjutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  temuanId: string;
  kondisi: string;
  nilaiTemuan: number;
  initialAksi?: string | null;
  initialJumlahSetor?: number;
}

const MAX_FILE_SIZE = 4 * 1024 * 1024;
const MAX_FILES = 10;

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 2,
  }).format(value);
}

export default function TindakLanjutModal({ isOpen, onClose, onSuccess, temuanId, kondisi, nilaiTemuan, initialAksi = "", initialJumlahSetor = 0 }: TindakLanjutModalProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [aksi, setAksi] = useState(initialAksi ?? "");
  const [jumlahSetor, setJumlahSetor] = useState(String(initialJumlahSetor));
  const [files, setFiles] = useState<File[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  if (!isOpen) return null;

  const jumlahSetorNumber = Number(jumlahSetor || 0);
  const sisa = nilaiTemuan - jumlahSetorNumber;

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.target.files ?? []);

    setMessage("");

    const validFiles: File[] = [];

    for (const file of selectedFiles) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setMessage(`${file.name}: format file tidak didukung.`);
        continue;
      }

      if (file.size === 0 || file.size > MAX_FILE_SIZE) {
        setMessage(`${file.name}: ukuran file harus antara 1 byte sampai 4 MB.`);
        continue;
      }

      validFiles.push(file);
    }

    setFiles((previous) => {
      const combined = [...previous, ...validFiles];

      if (combined.length > MAX_FILES) {
        setMessage(`Maksimal ${MAX_FILES} file bukti dukung.`);
        return combined.slice(0, MAX_FILES);
      }

      return combined;
    });

    event.target.value = "";
  }

  function removeFile(index: number) {
    setFiles((previous) => previous.filter((_, fileIndex) => fileIndex !== index));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSaving) return;

    setMessage("");

    if (!aksi.trim()) {
      setMessage("Aksi tindak lanjut wajib diisi.");
      return;
    }

    if (!Number.isFinite(jumlahSetorNumber) || jumlahSetorNumber < 0 || !/^(?:0|[1-9]\d{0,17})(?:\.\d{1,2})?$/.test(jumlahSetor)) {
      setMessage("Jumlah setor tidak valid.");
      return;
    }

    if (jumlahSetorNumber > nilaiTemuan) {
      setMessage("Jumlah setor tidak boleh melebihi nilai temuan.");
      return;
    }

    setIsSaving(true);

    try {
      const formData = new FormData();

      formData.set("temuanId", temuanId);
      formData.set("aksiTindakLanjut", aksi);
      formData.set("jumlahSetor", jumlahSetor);

      const result = await saveTindakLanjutAction(
        {
          status: "idle",
          message: "",
          laporanId: null,
        },
        formData,
      );

      if (result.status !== "success" || !result.laporanId) {
        throw new Error(result.message || "Gagal menyimpan tindak lanjut.");
      }

      const failedFiles: File[] = [];

      for (const file of files) {
        try {
          const uploadData = new FormData();

          uploadData.append("file", file);
          uploadData.append("laporanId", result.laporanId);

          const response = await fetch("/api/bukti-dukung", {
            method: "POST",
            body: uploadData,
          });

          const uploadResult = await response.json();

          if (!response.ok || !uploadResult.success) {
            throw new Error(uploadResult.message || "Upload file gagal.");
          }
        } catch (error) {
          console.error(`Upload ${file.name} gagal:`, error);
          failedFiles.push(file);
        }
      }

      setFiles(failedFiles);

      if (failedFiles.length > 0) {
        router.refresh();

        setMessage(`Data tindak lanjut tersimpan, tetapi ${failedFiles.length} file gagal diunggah. Silakan simpan kembali untuk mencoba upload ulang.`);
        return;
      }

      const successMessage = files.length > 0 ? "Tindak lanjut dan seluruh bukti dukung berhasil disimpan." : "Tindak lanjut berhasil disimpan.";

      // Tutup modal dan tampilkan notifikasi di komponen pemanggil.
      onSuccess(successMessage);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Terjadi kesalahan saat menyimpan data.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Overlay */}
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

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.98 }}
          transition={{ duration: 0.2 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="tindak-lanjut-modal-title"
          className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
            <div>
              <h2 id="tindak-lanjut-modal-title" className="text-lg font-bold text-slate-800">
                Form Tindak Lanjut
              </h2>

              <p className="mt-1 text-sm text-slate-500">Lengkapi realisasi tindak lanjut temuan.</p>
            </div>

            <button type="button" onClick={onClose} disabled={isSaving} className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50" aria-label="Tutup modal">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 overflow-y-auto px-6 py-5">
            {/* Informasi Temuan */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Informasi Temuan</p>

              <p className="mt-2 text-sm font-medium leading-relaxed text-slate-700">{kondisi}</p>

              <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3">
                <span className="text-sm text-slate-500">Nilai Temuan</span>

                <span className="font-semibold text-slate-800">{formatRupiah(nilaiTemuan)}</span>
              </div>
            </div>

            {/* Aksi Tindak Lanjut */}
            <div>
              <label htmlFor="aksiTindakLanjut" className="mb-2 block text-sm font-semibold text-slate-700">
                Aksi Tindak Lanjut
                <span className="ml-1 text-red-500">*</span>
              </label>

              <textarea
                id="aksiTindakLanjut"
                value={aksi}
                onChange={(event) => setAksi(event.target.value)}
                rows={5}
                maxLength={30000}
                required
                placeholder="Tuliskan uraian tindakan yang telah dilakukan..."
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#15406A] focus:ring-2 focus:ring-[#15406A]/10"
              />

              <p className="mt-1 text-right text-xs text-slate-400">{aksi.length.toLocaleString("id-ID")} / 30.000 karakter</p>
            </div>

            {/* Jumlah Setor */}
            <div>
              <label htmlFor="jumlahSetor" className="mb-2 block text-sm font-semibold text-slate-700">
                Jumlah Setor (Rp)
                <span className="ml-1 text-red-500">*</span>
              </label>

              <input
                id="jumlahSetor"
                type="number"
                min="0"
                max={nilaiTemuan}
                step="0.01"
                required
                value={jumlahSetor}
                onChange={(event) => setJumlahSetor(event.target.value)}
                placeholder="Masukkan jumlah setor"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#15406A] focus:ring-2 focus:ring-[#15406A]/10"
              />

              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-blue-50 p-3">
                  <p className="text-xs text-slate-500">Jumlah Setor</p>

                  <p className="mt-1 text-sm font-bold text-[#15406A]">{formatRupiah(Number.isFinite(jumlahSetorNumber) ? jumlahSetorNumber : 0)}</p>
                </div>

                <div className="rounded-lg bg-amber-50 p-3">
                  <p className="text-xs text-slate-500">Sisa Kewajiban</p>

                  <p className="mt-1 text-sm font-bold text-amber-700">{formatRupiah(Math.max(0, sisa))}</p>
                </div>
              </div>
            </div>

            {/* Bukti Dukung */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-700">Bukti Dukung</label>

                <span className="text-xs text-slate-400">Maks. 10 file, 4 MB/file</span>
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSaving || files.length >= MAX_FILES}
                className="flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center transition hover:border-[#15406A] hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <UploadCloud size={28} className="mb-2 text-[#15406A]" />

                <span className="text-sm font-semibold text-slate-700">Pilih file bukti dukung</span>

                <span className="mt-1 text-xs text-slate-400">JPG, PNG, WEBP, atau PDF</span>
              </button>

              <input ref={fileInputRef} type="file" multiple accept=".jpg,.jpeg,.png,.webp,.pdf" onChange={handleFileChange} className="hidden" />

              {files.length > 0 && (
                <div className="mt-3 space-y-2">
                  {files.map((file, index) => (
                    <div key={`${file.name}-${file.size}-${index}`} className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2">
                      {file.type === "application/pdf" ? <FileText size={20} className="shrink-0 text-red-500" /> : <ImageIcon size={20} className="shrink-0 text-blue-500" />}

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-700">{file.name}</p>

                        <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        disabled={isSaving}
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                        aria-label={`Hapus ${file.name} dari daftar upload`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pesan Error */}
            {message && (
              <div role="alert" aria-live="polite" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {message}
              </div>
            )}

            {/* Footer */}
            <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
              <button type="button" onClick={onClose} disabled={isSaving} className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50">
                Batal
              </button>

              <button type="submit" disabled={isSaving} className="flex items-center gap-2 rounded-xl bg-[#15406A] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#103454] disabled:cursor-not-allowed disabled:opacity-60">
                {isSaving ? (
                  <>
                    <LoaderCircle size={17} className="animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save size={17} />
                    Simpan Tindak Lanjut
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

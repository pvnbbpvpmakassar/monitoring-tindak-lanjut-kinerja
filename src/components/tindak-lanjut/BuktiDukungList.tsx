"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { FileText, Image as ImageIcon, X, LoaderCircle, AlertCircle, Trash2, AlertTriangle, CheckCircle2 } from "lucide-react";

interface BuktiDukung {
  id: string;
  nama_file: string;
  tipe_file: string;
  ukuran_file: number;
}

interface BuktiDukungListProps {
  laporanId: string | null;
}

interface ApiResponse {
  success: boolean;
  message?: string;
  data?: BuktiDukung[];
}

interface ToastMessage {
  title: string;
  message: string;
}

export default function BuktiDukungList({ laporanId }: BuktiDukungListProps) {
  const router = useRouter();

  const [files, setFiles] = useState<BuktiDukung[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<BuktiDukung | null>(null);
  const [error, setError] = useState("");
  const [previewError, setPreviewError] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState<{
    file: BuktiDukung;
    index: number;
  } | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [toast, setToast] = useState<ToastMessage | null>(null);

  useEffect(() => {
    if (typeof laporanId !== "string" || laporanId.trim() === "") {
      return;
    }

    const currentLaporanId = laporanId;
    const controller = new AbortController();

    async function loadFiles() {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(`/api/bukti-dukung?laporanId=${encodeURIComponent(currentLaporanId)}`, {
          method: "GET",
          cache: "no-store",
          signal: controller.signal,
        });

        const result: ApiResponse = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Gagal mengambil bukti dukung.");
        }

        if (!Array.isArray(result.data)) {
          throw new Error("Format data bukti dukung tidak valid.");
        }

        setFiles(result.data);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }

        setError(err instanceof Error ? err.message : "Gagal mengambil daftar bukti dukung.");
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadFiles();

    return () => {
      controller.abort();
    };
  }, [laporanId]);

  useEffect(() => {
    if (!toast) return;

    const timeout = window.setTimeout(() => {
      setToast(null);
    }, 3500);

    return () => window.clearTimeout(timeout);
  }, [toast]);

  if (!laporanId) return null;

  const selectedIndex = selectedFile ? files.findIndex((file) => file.id === selectedFile.id) + 1 : 0;

  const previewUrl = selectedFile ? `/api/bukti-dukung/${selectedFile.id}` : "";

  function openDeleteModal(file: BuktiDukung, index: number) {
    setDeleteError("");
    setConfirmDelete({ file, index });
  }

  function closeDeleteModal() {
    if (deletingId) return;

    setConfirmDelete(null);
    setDeleteError("");
  }

  async function handleDelete() {
    if (!confirmDelete || deletingId) return;

    const { file } = confirmDelete;

    setDeletingId(file.id);
    setDeleteError("");
    setError("");

    try {
      const response = await fetch(`/api/bukti-dukung/${file.id}`, {
        method: "DELETE",
      });

      const result: ApiResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Gagal menghapus bukti dukung.");
      }

      setFiles((previous) => previous.filter((item) => item.id !== file.id));

      if (selectedFile?.id === file.id) {
        setSelectedFile(null);
      }

      setConfirmDelete(null);

      setToast({
        title: "Penghapusan selesai",
        message: "Bukti dukung berhasil dihapus.",
      });

      router.refresh();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Terjadi kesalahan saat menghapus bukti dukung.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      {/* Daftar Bukti Dukung */}
      <div className="mt-4 border-t border-slate-100 pt-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Bukti Dukung</p>

        {isLoading ? (
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <LoaderCircle size={14} className="animate-spin" />
            Memuat bukti dukung...
          </div>
        ) : files.length === 0 ? (
          <p className="text-xs text-slate-400">Belum ada bukti dukung.</p>
        ) : (
          <div className="space-y-2">
            {files.map((file, index) => (
              <div key={file.id} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPreviewError(false);
                    setSelectedFile(file);
                  }}
                  className="inline-flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-[#15406A]/15 bg-[#15406A]/5 px-3 py-2.5 text-left text-xs font-medium text-[#15406A] transition hover:border-[#15406A]/30 hover:bg-[#15406A]/10"
                >
                  {file.tipe_file === "application/pdf" ? <FileText size={15} className="shrink-0" /> : <ImageIcon size={15} className="shrink-0" />}

                  <span>Bukti dukung {index + 1}</span>
                </button>

                <button
                  type="button"
                  onClick={() => openDeleteModal(file, index)}
                  disabled={deletingId !== null}
                  title={`Hapus bukti dukung ${index + 1}`}
                  aria-label={`Hapus bukti dukung ${index + 1}`}
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-rose-200 text-rose-500 transition hover:bg-rose-50 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="mt-2 flex items-center gap-2 text-xs text-rose-600">
            <AlertCircle size={14} />
            {error}
          </div>
        )}
      </div>

      {/* Toast Berhasil */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="fixed right-4 top-5 z-[220] flex w-[calc(100%-2rem)] max-w-sm items-start gap-3 rounded-xl border border-emerald-200 bg-white p-4 shadow-xl"
            role="status"
            aria-live="polite"
          >
            <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-emerald-600" />

            <div>
              <p className="text-sm font-semibold text-slate-800">{toast.title}</p>

              <p className="mt-1 text-xs leading-5 text-slate-500">{toast.message}</p>
            </div>

            <button type="button" onClick={() => setToast(null)} className="ml-auto text-slate-400 transition hover:text-slate-700" aria-label="Tutup notifikasi">
              <X size={17} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Konfirmasi Hapus */}
      <AnimatePresence>
        {confirmDelete && (
          <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
            <motion.button
              type="button"
              aria-label="Tutup konfirmasi"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeDeleteModal}
              disabled={deletingId !== null}
              className="fixed inset-0 cursor-default bg-slate-950/50 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="hapus-bukti-title"
              className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                <AlertTriangle size={24} />
              </div>

              <h2 id="hapus-bukti-title" className="mt-4 text-lg font-bold text-slate-800">
                Hapus Bukti Dukung?
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Anda akan menghapus <strong>Bukti dukung {confirmDelete.index + 1}</strong>. Tindakan ini tidak dapat dibatalkan.
              </p>

              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
                <p className="text-xs leading-5 text-amber-800">
                  <strong>Perhatian:</strong> file bukti dukung dan metadata yang tersimpan akan dihapus dari sistem.
                </p>
              </div>

              {deleteError && (
                <div aria-live="polite" className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {deleteError}
                </div>
              )}

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button type="button" onClick={closeDeleteModal} disabled={deletingId !== null} className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50">
                  Batal
                </button>

                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deletingId !== null}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 text-sm font-medium text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deletingId !== null ? (
                    <>
                      <LoaderCircle size={16} className="animate-spin" />
                      Menghapus...
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} />
                      Ya, Hapus Bukti Dukung
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Preview */}
      {selectedFile && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm" onClick={() => setSelectedFile(null)}>
          <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">Bukti dukung {selectedIndex}</h3>

                <p className="mt-0.5 text-xs text-slate-400">{selectedFile.tipe_file === "application/pdf" ? "Dokumen PDF" : "Gambar"}</p>
              </div>

              <button type="button" onClick={() => setSelectedFile(null)} className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" aria-label="Tutup preview">
                <X size={20} />
              </button>
            </div>

            <div className="min-h-[300px] flex-1 overflow-auto bg-slate-100 p-3">
              {previewError ? (
                <div className="flex min-h-[300px] flex-col items-center justify-center gap-2 text-slate-500">
                  <AlertCircle size={28} />
                  <p className="text-sm font-medium">Preview tidak dapat ditampilkan.</p>
                </div>
              ) : selectedFile.tipe_file === "application/pdf" ? (
                <iframe key={selectedFile.id} src={previewUrl} title={`Preview bukti dukung ${selectedIndex}`} className="h-[75vh] w-full rounded-lg bg-white" onError={() => setPreviewError(true)} />
              ) : (
                <div className="flex min-h-[300px] items-center justify-center">
                  <img key={selectedFile.id} src={previewUrl} alt={`Bukti dukung ${selectedIndex}`} className="max-h-[75vh] max-w-full rounded-lg object-contain" onError={() => setPreviewError(true)} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

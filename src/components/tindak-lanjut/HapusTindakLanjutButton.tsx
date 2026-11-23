"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, LoaderCircle, Trash2, X } from "lucide-react";
import { deleteTindakLanjutAction } from "@/actions/tindak-lanjut";

interface Props {
  laporanId: string;
  laporanLabel?: string;
}

export default function HapusTindakLanjutButton({ laporanId, laporanLabel = "laporan tindak lanjut ini" }: Props) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    if (isDeleting) return;

    setIsDeleting(true);
    setError("");

    try {
      const result = await deleteTindakLanjutAction(laporanId);
      if (!result.success) throw new Error(result.message);

      setIsOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat menghapus laporan.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => { setError(""); setIsOpen(true); }}
        className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
      >
        <Trash2 size={13} /> Hapus
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.button
              type="button"
              aria-label="Tutup konfirmasi"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isDeleting && setIsOpen(false)}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.98 }}
              role="alertdialog"
              aria-modal="true"
              aria-labelledby={`hapus-laporan-title-${laporanId}`}
              className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
            >
              <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                    <AlertTriangle size={20} />
                  </div>
                  <div>
                    <h2 id={`hapus-laporan-title-${laporanId}`} className="font-bold text-slate-800">Hapus Tindak Lanjut</h2>
                    <p className="mt-0.5 text-xs text-slate-500">Konfirmasi penghapusan laporan</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  disabled={isDeleting}
                  aria-label="Tutup"
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 disabled:opacity-50"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3 px-5 py-5">
                <p className="text-sm leading-6 text-slate-600">
                  Apakah Anda yakin ingin menghapus <span className="font-semibold text-slate-800">{laporanLabel}</span>?
                </p>
                <div className="rounded-xl border border-rose-100 bg-rose-50 p-3 text-xs leading-5 text-rose-700">
                  Data laporan, status verifikasi, dan seluruh bukti dukung yang terhubung dengan laporan ini akan ikut dihapus. Setoran laporan lain tidak akan berubah.
                </div>
                {error && (
                  <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                    {error}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  disabled={isDeleting}
                  className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isDeleting ? <><LoaderCircle size={16} className="animate-spin" /> Menghapus...</> : <><Trash2 size={16} /> Ya, Hapus</>}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

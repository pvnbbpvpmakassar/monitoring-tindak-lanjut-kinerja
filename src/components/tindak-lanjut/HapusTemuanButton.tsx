
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Trash2,
  X,
  AlertTriangle,
  LoaderCircle,
  CheckCircle2,
} from "lucide-react";

import { deleteTemuanAction } from "@/actions/temuan";

interface HapusTemuanButtonProps {
  id: string;
  nomorTemuan: string;
}

export default function HapusTemuanButton({
  id,
  nomorTemuan,
}: HapusTemuanButtonProps) {
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const [pending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteTemuanAction(id);

      setMessage(result.message);
      setIsError(result.status === "error");

      if (result.status === "success") {
        setIsOpen(false);
        setShowToast(true);
        router.refresh();
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setMessage("");
          setIsError(false);
          setIsOpen(true);
        }}
        className="inline-flex h-9 items-center gap-2 rounded-lg border border-rose-200 bg-white px-3 text-xs font-medium text-rose-600 transition hover:bg-rose-50"
      >
        <Trash2 size={14} />
        Hapus
      </button>

      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="fixed right-4 top-5 z-[220] flex w-[calc(100%-2rem)] max-w-sm items-start gap-3 rounded-xl border border-emerald-200 bg-white p-4 shadow-xl"
            role="status"
            aria-live="polite"
          >
            <CheckCircle2
              size={20}
              className="mt-0.5 shrink-0 text-emerald-600"
            />

            <div>
              <p className="text-sm font-semibold text-slate-800">
                Penghapusan selesai
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                {message}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowToast(false)}
              className="ml-auto text-slate-400 hover:text-slate-700"
              aria-label="Tutup notifikasi"
            >
              <X size={17} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
            <motion.button
              type="button"
              aria-label="Tutup konfirmasi"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!pending) setIsOpen(false);
              }}
              className="fixed inset-0 cursor-default bg-slate-950/50 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              role="alertdialog"
              aria-modal="true"
              aria-labelledby={`hapus-temuan-title-${id}`}
              className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                <AlertTriangle size={24} />
              </div>

              <h2
                id={`hapus-temuan-title-${id}`}
                className="mt-4 text-lg font-bold text-slate-800"
              >
                Hapus Data Temuan?
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Anda akan menghapus <strong>{nomorTemuan}</strong>.
                Tindakan ini tidak dapat dibatalkan.
              </p>

              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
                <p className="text-xs leading-5 text-amber-800">
                  <strong>Perhatian:</strong> laporan tindak lanjut,
                  status verifikasi, dan metadata bukti dukung yang
                  terhubung juga akan dihapus. File bukti dukung di
                  Vercel Blob akan ikut diupayakan untuk dihapus.
                </p>
              </div>

              {message && isError && (
                <div
                  aria-live="polite"
                  className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700"
                >
                  {message}
                </div>
              )}

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  disabled={pending}
                  className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Batal
                </button>

                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={pending}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 text-sm font-medium text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {pending ? (
                    <LoaderCircle
                      size={16}
                      className="animate-spin"
                    />
                  ) : (
                    <Trash2 size={16} />
                  )}
                  {pending ? "Menghapus..." : "Ya, Hapus Temuan"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

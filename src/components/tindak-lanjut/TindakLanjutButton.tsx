"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, X, CheckCircle2 } from "lucide-react";
import TindakLanjutModal from "@/components/tindak-lanjut/TindakLanjutModal";

interface TindakLanjutButtonProps {
  temuanId: string;
  kondisi: string;
  nilaiTemuan: number;
  totalSetor: number;
}

interface ToastMessage {
  title: string;
  message: string;
}

export default function TindakLanjutButton({ temuanId, kondisi, nilaiTemuan, totalSetor }: TindakLanjutButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  function handleSuccess(message: string) {
    setToast({ title: "Berhasil disimpan", message });
    setIsOpen(false);
    window.requestAnimationFrame(() => router.refresh());
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-[#15406A] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[#103454] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Plus size={15} /> Tambah Tindak Lanjut
      </button>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -15, x: 15 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: -15, x: 15 }}
            transition={{ duration: 0.2 }}
            className="fixed right-4 top-5 z-[220] flex w-[calc(100%-2rem)] max-w-sm items-start gap-3 rounded-xl border border-emerald-200 bg-white p-4 shadow-xl"
            role="status"
            aria-live="polite"
          >
            <CheckCircle2 size={21} className="mt-0.5 shrink-0 text-emerald-600" />
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

      {isOpen && <TindakLanjutModal isOpen={isOpen} onClose={() => setIsOpen(false)} onSuccess={handleSuccess} temuanId={temuanId} kondisi={kondisi} nilaiTemuan={nilaiTemuan} totalSetor={totalSetor} />}
    </>
  );
}

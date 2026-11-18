
"use client";

import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useActionState, useEffect, useRef, useState } from "react";

import {
  X,
  Plus,
  ClipboardList,
  Save,
  LoaderCircle,
  CheckCircle2,
} from "lucide-react";

import {
  createTemuanAction,
  type TemuanState,
} from "@/actions/temuan";

import RichTextEditor from "./RichTextEditor";

interface TambahTemuanModalProps {
  tahun: number;
  hasSuratTugas: boolean;
}

const initialState: TemuanState = {
  status: "idle",
  message: "",
};

const EMPTY_REKOMENDASI = "<p></p>";

// Format angka dengan pemisah ribuan titik dan desimal koma.
function formatRupiahInput(value: string): string {
  const cleaned = value.replace(/[^\d,]/g, "");
  const parts = cleaned.split(",");

  const integerPart = parts[0] ?? "";
  const decimalPart = parts[1];

  const formattedInteger = integerPart.replace(
    /\B(?=(\d{3})+(?!\d))/g,
    "."
  );

  if (decimalPart !== undefined) {
    return `${formattedInteger},${decimalPart}`;
  }

  return formattedInteger;
}

// Konversi format tampilan Rupiah menjadi angka standar.
function normalizeRupiahInput(value: string): string {
  const parts = value.split(",");

  const integerPart = (parts[0] ?? "").replace(/\./g, "");
  const decimalPart = parts[1];

  if (decimalPart !== undefined && decimalPart !== "") {
    return `${integerPart}.${decimalPart}`;
  }

  return integerPart;
}

export default function TambahTemuanModal({
  tahun,
  hasSuratTugas,
}: TambahTemuanModalProps) {
  const router = useRouter();

  const formRef = useRef<HTMLFormElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const [rekomendasi, setRekomendasi] = useState(
    EMPTY_REKOMENDASI
  );

  const [nilaiTemuanDisplay, setNilaiTemuanDisplay] =
    useState("");

  const [state, formAction, pending] = useActionState(
    createTemuanAction,
    initialState
  );

  // Menangani penyimpanan yang berhasil.
  useEffect(() => {
    if (state.status !== "success") return;

    const resetTimeout = window.setTimeout(() => {
      formRef.current?.reset();

      setRekomendasi(EMPTY_REKOMENDASI);
      setNilaiTemuanDisplay("");
      setIsOpen(false);
      setShowToast(true);

      router.refresh();
    }, 0);

    const toastTimeout = window.setTimeout(() => {
      setShowToast(false);
    }, 3500);

    return () => {
      window.clearTimeout(resetTimeout);
      window.clearTimeout(toastTimeout);
    };
  }, [state.status, router]);

  // Membuka modal.
  function openModal() {
    if (!hasSuratTugas) return;

    formRef.current?.reset();

    setRekomendasi(EMPTY_REKOMENDASI);
    setNilaiTemuanDisplay("");

    setIsOpen(true);
  }

  // Menutup modal.
  function closeModal() {
    if (pending) return;

    formRef.current?.reset();

    setRekomendasi(EMPTY_REKOMENDASI);
    setNilaiTemuanDisplay("");

    setIsOpen(false);
  }

  // Menangani perubahan input nilai temuan.
  function handleNilaiTemuanChange(value: string) {
    setNilaiTemuanDisplay(formatRupiahInput(value));
  }

  return (
    <>
      {/* Tombol Tambah Temuan */}
      <button
        type="button"
        onClick={openModal}
        disabled={!hasSuratTugas}
        title={
          hasSuratTugas
            ? "Tambah data temuan"
            : "Atur nomor Surat Tugas terlebih dahulu"
        }
        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#15406A] px-4 text-sm font-medium text-white transition hover:bg-[#103455] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Plus size={17} />
        Tambah Temuan
      </button>

      {!hasSuratTugas && (
        <p className="mt-2 text-xs text-amber-600">
          Atur nomor Surat Tugas tahun {tahun} sebelum menambahkan
          temuan.
        </p>
      )}

      {/* Notifikasi Berhasil */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -15, x: 15 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: -15, x: 15 }}
            transition={{ duration: 0.2 }}
            className="fixed right-4 top-5 z-[200] flex w-[calc(100%-2rem)] max-w-sm items-start gap-3 rounded-xl border border-emerald-200 bg-white p-4 shadow-xl"
            role="status"
            aria-live="polite"
          >
            <CheckCircle2
              size={21}
              className="mt-0.5 shrink-0 text-emerald-600"
            />

            <div>
              <p className="text-sm font-semibold text-slate-800">
                Berhasil disimpan
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Data temuan berhasil ditambahkan.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowToast(false)}
              className="ml-auto text-slate-400 transition hover:text-slate-700"
              aria-label="Tutup notifikasi"
            >
              <X size={17} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Tambah Temuan */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto p-4">
            {/* Background Overlay */}
            <motion.button
              type="button"
              aria-label="Tutup modal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              disabled={pending}
              className="fixed inset-0 cursor-default bg-slate-950/50 backdrop-blur-sm"
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="temuan-modal-title"
              className="relative z-10 my-auto w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#15406A]">
                    <ClipboardList size={20} />
                  </div>

                  <div>
                    <h2
                      id="temuan-modal-title"
                      className="font-semibold text-slate-800"
                    >
                      Tambah Data Temuan
                    </h2>

                    <p className="mt-1 text-xs text-slate-500">
                      Tahun Anggaran {tahun}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={pending}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                  aria-label="Tutup modal"
                >
                  <X size={19} />
                </button>
              </div>

              {/* Form */}
              <form ref={formRef} action={formAction}>
                <input
                  type="hidden"
                  name="tahun"
                  value={tahun}
                />

                <div className="max-h-[65vh] space-y-5 overflow-y-auto px-6 py-6">
                  {/* Kondisi Temuan */}
                  <div>
                    <label
                      htmlFor="kondisi"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Kondisi Temuan
                      <span className="ml-1 text-rose-500">
                        *
                      </span>
                    </label>

                    <textarea
                      id="kondisi"
                      name="kondisi"
                      rows={4}
                      maxLength={10000}
                      required
                      placeholder="Uraikan kondisi atau permasalahan yang ditemukan..."
                      className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm leading-6 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#15406A] focus:ring-2 focus:ring-[#15406A]/10"
                    />

                    <p className="mt-1.5 text-xs text-slate-400">
                      Masukkan uraian kondisi temuan secara jelas.
                    </p>
                  </div>

                  {/* Rekomendasi */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Rekomendasi
                      <span className="ml-1 text-rose-500">
                        *
                      </span>
                    </label>

                    <RichTextEditor
                      value={rekomendasi}
                      onChange={setRekomendasi}
                    />

                    <input
                      type="hidden"
                      name="rekomendasi"
                      value={rekomendasi}
                    />

                    <p className="mt-1.5 text-xs text-slate-400">
                      Gunakan toolbar untuk mengatur format teks,
                      daftar, dan kutipan.
                    </p>
                  </div>

                  {/* Nilai Temuan */}
                  <div>
                    <label
                      htmlFor="nilai-temuan"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Nilai Temuan
                      <span className="ml-1 text-rose-500">
                        *
                      </span>
                    </label>

                    <div className="flex overflow-hidden rounded-xl border border-slate-200 transition focus-within:border-[#15406A] focus-within:ring-2 focus-within:ring-[#15406A]/10">
                      <span className="flex items-center border-r border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-500">
                        Rp
                      </span>

                      <input
                        id="nilai-temuan"
                        type="text"
                        inputMode="decimal"
                        value={nilaiTemuanDisplay}
                        onChange={(e) =>
                          handleNilaiTemuanChange(e.target.value)
                        }
                        required
                        placeholder="0"
                        className="h-12 min-w-0 flex-1 px-4 text-sm text-slate-700 outline-none"
                      />

                      {/* Nilai asli untuk dikirim ke server */}
                      <input
                        type="hidden"
                        name="nilai_temuan"
                        value={normalizeRupiahInput(
                          nilaiTemuanDisplay
                        )}
                      />
                    </div>

                    <p className="mt-1.5 text-xs text-slate-400">
                      Pemisah ribuan menggunakan titik (.) dan
                      desimal menggunakan koma (,).
                    </p>
                  </div>

                  {/* Pesan Error */}
                  {state.status === "error" && state.message && (
                    <div
                      aria-live="polite"
                      className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700"
                    >
                      {state.message}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/70 px-6 py-4 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={pending}
                    className="h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    Batal
                  </button>

                  <button
                    type="submit"
                    disabled={pending}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#15406A] px-5 text-sm font-medium text-white transition hover:bg-[#103455] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {pending ? (
                      <LoaderCircle
                        size={17}
                        className="animate-spin"
                      />
                    ) : (
                      <Save size={17} />
                    )}

                    {pending ? "Menyimpan..." : "Simpan Temuan"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

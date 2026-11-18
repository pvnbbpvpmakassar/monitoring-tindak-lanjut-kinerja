
"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Pencil,
  X,
  Save,
  LoaderCircle,
  CheckCircle2,
} from "lucide-react";

import {
  updateTemuanAction,
  type TemuanState,
} from "@/actions/temuan";

import RichTextEditor from "./RichTextEditor";

interface EditTemuanModalProps {
  id: string;
  kondisi: string;
  rekomendasi: string;
  nilaiTemuan: number;
}

const initialState: TemuanState = {
  status: "idle",
  message: "",
};

function formatRupiahInput(value: string): string {
  const cleaned = value.replace(/[^\d,]/g, "");
  const parts = cleaned.split(",");

  const integerPart = parts[0] ?? "";
  const decimalPart = parts[1]?.slice(0, 2);

  const formattedInteger = integerPart.replace(
    /\B(?=(\d{3})+(?!\d))/g,
    "."
  );

  return decimalPart !== undefined
    ? `${formattedInteger},${decimalPart}`
    : formattedInteger;
}

function normalizeRupiahInput(value: string): string {
  const parts = value.split(",");
  const integerPart = (parts[0] ?? "").replace(/\./g, "");
  const decimalPart = parts[1];

  return decimalPart !== undefined && decimalPart !== ""
    ? `${integerPart}.${decimalPart}`
    : integerPart;
}

function initialRupiah(value: number): string {
  if (!Number.isFinite(value)) return "";

  return value.toLocaleString("id-ID", {
    maximumFractionDigits: 2,
  });
}

export default function EditTemuanModal({
  id,
  kondisi,
  rekomendasi,
  nilaiTemuan,
}: EditTemuanModalProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const [kondisiValue, setKondisiValue] = useState(kondisi);
  const [rekomendasiValue, setRekomendasiValue] =
    useState(rekomendasi || "<p></p>");
  const [nilaiDisplay, setNilaiDisplay] = useState(
    initialRupiah(nilaiTemuan)
  );

  const [state, formAction, pending] = useActionState(
    updateTemuanAction,
    initialState
  );

  useEffect(() => {
    if (state.status !== "success") return;

    const resetTimeout = window.setTimeout(() => {
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

  function openModal() {
    setKondisiValue(kondisi);
    setRekomendasiValue(rekomendasi || "<p></p>");
    setNilaiDisplay(initialRupiah(nilaiTemuan));
    setIsOpen(true);
  }

  function closeModal() {
    if (pending) return;
    setIsOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#15406A]"
      >
        <Pencil size={14} />
        Edit
      </button>

      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="fixed right-4 top-5 z-[220] flex w-[calc(100%-2rem)] max-w-sm items-start gap-3 rounded-xl border border-emerald-200 bg-white p-4 shadow-xl"
            role="status"
          >
            <CheckCircle2
              size={20}
              className="mt-0.5 shrink-0 text-emerald-600"
            />
            <div>
              <p className="text-sm font-semibold text-slate-800">
                Berhasil diperbarui
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Data temuan berhasil diperbarui.
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
          <div className="fixed inset-0 z-[150] flex items-center justify-center overflow-y-auto p-4">
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

            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              role="dialog"
              aria-modal="true"
              aria-labelledby={`edit-temuan-title-${id}`}
              className="relative z-10 my-auto w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#15406A]">
                    <Pencil size={19} />
                  </div>
                  <div>
                    <h2
                      id={`edit-temuan-title-${id}`}
                      className="font-semibold text-slate-800"
                    >
                      Edit Data Temuan
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                      Perbarui informasi temuan
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={pending}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Tutup modal"
                >
                  <X size={19} />
                </button>
              </div>

              <form ref={formRef} action={formAction}>
                <input type="hidden" name="id" value={id} />

                <div className="max-h-[65vh] space-y-5 overflow-y-auto px-6 py-6">
                  <div>
                    <label
                      htmlFor={`edit-kondisi-${id}`}
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Kondisi Temuan
                      <span className="ml-1 text-rose-500">*</span>
                    </label>
                    <textarea
                      id={`edit-kondisi-${id}`}
                      name="kondisi"
                      rows={4}
                      maxLength={10000}
                      required
                      value={kondisiValue}
                      onChange={(e) =>
                        setKondisiValue(e.target.value)
                      }
                      className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm leading-6 text-slate-700 outline-none transition focus:border-[#15406A] focus:ring-2 focus:ring-[#15406A]/10"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Rekomendasi
                      <span className="ml-1 text-rose-500">*</span>
                    </label>

                    <RichTextEditor
                      value={rekomendasiValue}
                      onChange={setRekomendasiValue}
                    />

                    <input
                      type="hidden"
                      name="rekomendasi"
                      value={rekomendasiValue}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor={`edit-nilai-${id}`}
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Nilai Temuan
                      <span className="ml-1 text-rose-500">*</span>
                    </label>

                    <div className="flex overflow-hidden rounded-xl border border-slate-200 transition focus-within:border-[#15406A] focus-within:ring-2 focus-within:ring-[#15406A]/10">
                      <span className="flex items-center border-r border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-500">
                        Rp
                      </span>
                      <input
                        id={`edit-nilai-${id}`}
                        type="text"
                        inputMode="decimal"
                        value={nilaiDisplay}
                        onChange={(e) =>
                          setNilaiDisplay(
                            formatRupiahInput(e.target.value)
                          )
                        }
                        required
                        placeholder="0"
                        className="h-12 min-w-0 flex-1 px-4 text-sm text-slate-700 outline-none"
                      />
                      <input
                        type="hidden"
                        name="nilai_temuan"
                        value={normalizeRupiahInput(nilaiDisplay)}
                      />
                    </div>
                    <p className="mt-1.5 text-xs text-slate-400">
                      Titik untuk pemisah ribuan dan koma untuk desimal.
                    </p>
                  </div>

                  {state.status === "error" && state.message && (
                    <div
                      aria-live="polite"
                      className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700"
                    >
                      {state.message}
                    </div>
                  )}
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/70 px-6 py-4 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={pending}
                    className="h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
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
                    {pending ? "Menyimpan..." : "Simpan Perubahan"}
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

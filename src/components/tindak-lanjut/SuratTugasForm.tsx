
"use client";

import { useActionState } from "react";
import { FileText, Save, LoaderCircle } from "lucide-react";

import {
  saveSuratTugasAction,
  type SuratTugasState,
} from "@/actions/surat-tugas";

const initialState: SuratTugasState = {
  status: "idle",
  message: "",
};

interface SuratTugasFormProps {
  tahun: number;
  nomorSurat: string;
}

export default function SuratTugasForm({
  tahun,
  nomorSurat,
}: SuratTugasFormProps) {
  const [state, formAction, pending] = useActionState(
    saveSuratTugasAction,
    initialState
  );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#15406A]">
            <FileText size={21} />
          </div>

          <div>
            <h2 className="text-sm font-semibold text-slate-800">
              Surat Tugas Inspektur Jenderal
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Nomor Surat Tugas Tahun Anggaran {tahun}
            </p>

            <p className="mt-2 text-sm font-medium text-[#15406A]">
              {nomorSurat || "Nomor surat belum diatur"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start rounded-lg bg-slate-50 px-3 py-2 text-xs font-medium text-slate-500 lg:self-center">
          <span
            className={`h-2 w-2 rounded-full ${
              nomorSurat ? "bg-emerald-500" : "bg-amber-500"
            }`}
          />
          {nomorSurat ? "Data tersedia" : "Belum tersedia"}
        </div>
      </div>

      <form action={formAction} className="mt-5 border-t border-slate-100 pt-5">
        <input type="hidden" name="tahun" value={tahun} />

        <label
          htmlFor={`nomor-surat-${tahun}`}
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Nomor Surat Tugas
        </label>

        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            id={`nomor-surat-${tahun}`}
            name="nomor_surat"
            type="text"
            defaultValue={nomorSurat}
            placeholder="Masukkan nomor Surat Tugas..."
            maxLength={255}
            required
            className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#15406A] focus:ring-2 focus:ring-[#15406A]/10"
          />

          <button
            type="submit"
            disabled={pending}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#15406A] px-5 text-sm font-medium text-white transition hover:bg-[#103455] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? (
              <LoaderCircle size={17} className="animate-spin" />
            ) : (
              <Save size={17} />
            )}

            {pending ? "Menyimpan..." : "Simpan Nomor"}
          </button>
        </div>

        {state.message && (
          <p
            aria-live="polite"
            className={`mt-3 text-sm ${
              state.status === "success"
                ? "text-emerald-600"
                : "text-rose-600"
            }`}
          >
            {state.message}
          </p>
        )}
      </form>
    </div>
  );
}

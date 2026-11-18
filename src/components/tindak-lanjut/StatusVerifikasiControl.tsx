"use client";

import { useState, useTransition } from "react";
import { Check, LoaderCircle, Save } from "lucide-react";
import { updateStatusVerifikasiAction } from "@/actions/status-verifikasi";

interface StatusVerifikasiControlProps {
  temuanId: string;
  initialStatus: "Sesuai" | "Tidak Sesuai" | null;
}

export default function StatusVerifikasiControl({
  temuanId,
  initialStatus,
}: StatusVerifikasiControlProps) {
  const [status, setStatus] = useState<"Sesuai" | "Tidak Sesuai" | "">(
    initialStatus ?? ""
  );
  const [savedStatus, setSavedStatus] = useState(initialStatus ?? "");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const hasChanged = status !== savedStatus;

  function handleSave() {
    if (!status || !hasChanged) return;

    setMessage("");

    startTransition(async () => {
      const result = await updateStatusVerifikasiAction(
        temuanId,
        status as "Sesuai" | "Tidak Sesuai"
      );

      setMessage(result.message);

      if (result.success) {
        setSavedStatus(status);
      }
    });
  }

  return (
    <div className="mt-4 border-t border-slate-100 pt-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
        Status Verifikasi Admin
      </p>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={isPending}
          onClick={() => {
            setStatus("Sesuai");
            setMessage("");
          }}
          className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-semibold transition ${
            status === "Sesuai"
              ? "border-emerald-500 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500"
              : "border-slate-200 bg-white text-slate-500 hover:border-emerald-300 hover:bg-emerald-50"
          }`}
        >
          {status === "Sesuai" && <Check size={14} />}
          Sesuai
        </button>

        <button
          type="button"
          disabled={isPending}
          onClick={() => {
            setStatus("Tidak Sesuai");
            setMessage("");
          }}
          className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-semibold transition ${
            status === "Tidak Sesuai"
              ? "border-rose-500 bg-rose-50 text-rose-700 ring-1 ring-rose-500"
              : "border-slate-200 bg-white text-slate-500 hover:border-rose-300 hover:bg-rose-50"
          }`}
        >
          {status === "Tidak Sesuai" && <Check size={14} />}
          Tidak Sesuai
        </button>
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={!status || !hasChanged || isPending}
        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#15406A] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#103454] disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isPending ? (
          <>
            <LoaderCircle size={15} className="animate-spin" />
            Menyimpan...
          </>
        ) : (
          <>
            <Save size={15} />
            Simpan Status
          </>
        )}
      </button>

      {message && (
        <p
          className={`mt-2 text-xs ${
            savedStatus === status && !hasChanged
              ? "text-emerald-600"
              : "text-rose-600"
          }`}
        >
          {message}
        </p>
      )}

      {!initialStatus && (
        <p className="mt-2 text-xs text-slate-400">
          Temuan ini belum memiliki status verifikasi.
        </p>
      )}
    </div>
  );
}
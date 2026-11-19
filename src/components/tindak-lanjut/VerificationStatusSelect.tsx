
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  AlertCircle,
  LoaderCircle,
  CalendarClock,
} from "lucide-react";

import {
  updateVerificationStatusAction,
  type VerificationStatus,
} from "@/actions/status-verifikasi";

interface VerificationStatusSelectProps {
  laporanId: string | null;
  status: VerificationStatus | null;
  tanggalVerifikasi: string | null;
  diverifikasiOlehNama: string | null;
}

export default function VerificationStatusSelect({
  laporanId,
  status,
  tanggalVerifikasi,
  diverifikasiOlehNama,
}: VerificationStatusSelectProps) {
  const router = useRouter();

  const [selectedStatus, setSelectedStatus] = useState<
    VerificationStatus | ""
  >(status ?? "");

  const [lastUpdated, setLastUpdated] = useState<string | null>(
    tanggalVerifikasi
  );

  const [updatedBy, setUpdatedBy] = useState<string | null>(
    diverifikasiOlehNama
  );

  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  function formatTanggalWITA(value: string) {
    return new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Makassar",
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).format(new Date(value)) + " WITA";
  }

  async function handleStatusChange(
    newStatus: VerificationStatus | ""
  ) {
    if (!laporanId || !newStatus || isSaving) return;

    const previousStatus = selectedStatus;

    setSelectedStatus(newStatus);
    setMessage("");
    setIsSaving(true);

    try {
      const result = await updateVerificationStatusAction(
        laporanId,
        newStatus
      );

      if (result.status !== "success") {
        setSelectedStatus(previousStatus);
        setIsSuccess(false);
        setMessage(result.message);
        return;
      }

      setIsSuccess(true);
      setMessage(result.message);

      if (result.tanggalVerifikasi) {
        setLastUpdated(result.tanggalVerifikasi);
      }

      if (result.diverifikasiOleh) {
        setUpdatedBy(result.diverifikasiOleh);
      }

      router.refresh();
    } catch (error) {
      console.error("Gagal memperbarui status:", error);

      setSelectedStatus(previousStatus);
      setIsSuccess(false);
      setMessage("Terjadi kesalahan. Silakan coba kembali.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <select
          value={selectedStatus}
          disabled={!laporanId || isSaving}
          onChange={(event) =>
            handleStatusChange(
              event.target.value as VerificationStatus | ""
            )
          }
          className={`w-full appearance-none rounded-lg border px-3 py-2.5 pr-10 text-sm font-semibold outline-none transition
            ${
              selectedStatus === "Sesuai"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : selectedStatus === "Tidak Sesuai"
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-slate-200 bg-white text-slate-500"
            }
            ${
              !laporanId || isSaving
                ? "cursor-not-allowed opacity-70"
                : "cursor-pointer hover:border-[#15406A] focus:border-[#15406A] focus:ring-2 focus:ring-[#15406A]/10"
            }`}
        >
          <option value="" disabled>
            Pilih status verifikasi
          </option>

          <option value="Sesuai">Sesuai</option>
          <option value="Tidak Sesuai">Tidak Sesuai</option>
        </select>

        <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
          {isSaving ? (
            <LoaderCircle
              size={16}
              className="animate-spin text-[#15406A]"
            />
          ) : (
            <svg
              className="h-4 w-4 text-slate-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.09 1.032l-4.25 4.5a.75.75 0 01-1.09 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>
      </div>

      {!laporanId && (
        <p className="text-xs text-slate-400">
          Isi tindak lanjut terlebih dahulu sebelum melakukan verifikasi.
        </p>
      )}

      {lastUpdated && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="flex items-start gap-2">
            <CalendarClock
              size={16}
              className="mt-0.5 shrink-0 text-slate-500"
            />

            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500">
                Terakhir diperbarui
              </p>

              <p className="mt-1 text-xs font-semibold text-slate-700">
                {formatTanggalWITA(lastUpdated)}
              </p>

              {updatedBy && (
                <p className="mt-1 text-xs text-slate-500">
                  Oleh: {updatedBy}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {message && (
        <div
          role="status"
          aria-live="polite"
          className={`flex items-start gap-2 rounded-lg px-3 py-2 text-xs ${
            isSuccess
              ? "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {isSuccess ? (
            <CheckCircle2
              size={15}
              className="mt-0.5 shrink-0"
            />
          ) : (
            <AlertCircle
              size={15}
              className="mt-0.5 shrink-0"
            />
          )}

          <span>{message}</span>
        </div>
      )}
    </div>
  );
}

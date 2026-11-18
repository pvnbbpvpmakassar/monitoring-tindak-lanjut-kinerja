
"use client";

import { useEffect, useState } from "react";
import {
  FileText,
  Image as ImageIcon,
  X,
  LoaderCircle,
  AlertCircle,
} from "lucide-react";

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

export default function BuktiDukungList({
  laporanId,
}: BuktiDukungListProps) {
  const [files, setFiles] = useState<BuktiDukung[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<BuktiDukung | null>(null);
  const [error, setError] = useState("");
  const [previewError, setPreviewError] = useState(false);

  useEffect(() => {
    if (typeof laporanId !== "string" || laporanId.trim() === "") {
      return;
    }

    // Memastikan ID bertipe string, bukan string | null.
    const currentLaporanId: string = laporanId;
    const controller = new AbortController();

    async function loadFiles() {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(
          `/api/bukti-dukung?laporanId=${encodeURIComponent(
            currentLaporanId
          )}`,
          {
            method: "GET",
            cache: "no-store",
            signal: controller.signal,
          }
        );

        const result: ApiResponse = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message || "Gagal mengambil bukti dukung."
          );
        }

        if (!Array.isArray(result.data)) {
          throw new Error("Format data bukti dukung tidak valid.");
        }

        setFiles(result.data);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : "Gagal mengambil daftar bukti dukung."
        );
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

  if (!laporanId) {
    return null;
  }

  const selectedIndex = selectedFile
    ? files.findIndex((file) => file.id === selectedFile.id) + 1
    : 0;

  const previewUrl = selectedFile
    ? `/api/bukti-dukung/${selectedFile.id}`
    : "";

  return (
    <>
      <div className="mt-4 border-t border-slate-100 pt-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Bukti Dukung
        </p>

        {isLoading ? (
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <LoaderCircle size={14} className="animate-spin" />
            Memuat bukti dukung...
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 text-xs text-rose-600">
            <AlertCircle size={14} />
            {error}
          </div>
        ) : files.length === 0 ? (
          <p className="text-xs text-slate-400">
            Belum ada bukti dukung.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {files.map((file, index) => (
              <button
                key={file.id}
                type="button"
                onClick={() => {
                  setPreviewError(false);
                  setSelectedFile(file);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#15406A]/15 bg-[#15406A]/5 px-3 py-2 text-xs font-medium text-[#15406A] transition hover:border-[#15406A]/30 hover:bg-[#15406A]/10"
              >
                {file.tipe_file === "application/pdf" ? (
                  <FileText size={14} />
                ) : (
                  <ImageIcon size={14} />
                )}

                Bukti dukung {index + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedFile && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
          onClick={() => setSelectedFile(null)}
        >
          <div
            className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            {/* Header modal */}
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">
                  Bukti dukung {selectedIndex}
                </h3>

                <p className="mt-0.5 text-xs text-slate-400">
                  {selectedFile.tipe_file === "application/pdf"
                    ? "Dokumen PDF"
                    : "Gambar"}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedFile(null)}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Tutup preview"
              >
                <X size={20} />
              </button>
            </div>

            {/* Preview */}
            <div className="min-h-[300px] flex-1 overflow-auto bg-slate-100 p-3">
              {previewError ? (
                <div className="flex min-h-[300px] flex-col items-center justify-center gap-2 text-slate-500">
                  <AlertCircle size={28} />
                  <p className="text-sm font-medium">
                    Preview tidak dapat ditampilkan.
                  </p>
                  <p className="text-xs">
                    Silakan coba kembali atau periksa file bukti dukung.
                  </p>
                </div>
              ) : selectedFile.tipe_file === "application/pdf" ? (
                <iframe
                  key={selectedFile.id}
                  src={previewUrl}
                  title={`Preview bukti dukung ${selectedIndex}`}
                  className="h-[75vh] w-full rounded-lg bg-white"
                  onError={() => setPreviewError(true)}
                />
              ) : (
                <div className="flex min-h-[300px] items-center justify-center">
                  <img
                    key={selectedFile.id}
                    src={previewUrl}
                    alt={`Bukti dukung ${selectedIndex}`}
                    className="max-h-[75vh] max-w-full rounded-lg object-contain"
                    onError={() => setPreviewError(true)}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

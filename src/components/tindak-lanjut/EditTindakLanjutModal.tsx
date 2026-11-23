"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Pencil, X, Save, UploadCloud, FileText, Image as ImageIcon, Trash2, LoaderCircle } from "lucide-react";
import { updateTindakLanjutAction } from "@/actions/tindak-lanjut";

interface Props {
  laporanId: string;
  kondisi: string;
  nilaiTemuan: number;
  totalSetor: number;
  aksi: string;
  jumlahSetor: number;
}

const MAX_FILE_SIZE = 4 * 1024 * 1024;
const MAX_FILES = 10;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 2 }).format(value);
}

export default function EditTindakLanjutModal({ laporanId, kondisi, nilaiTemuan, totalSetor, aksi, jumlahSetor }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [aksiValue, setAksiValue] = useState(aksi);
  const [jumlahValue, setJumlahValue] = useState(String(jumlahSetor));
  const [files, setFiles] = useState<File[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  const totalLaporanLain = totalSetor - jumlahSetor;
  const sisaSetelahEdit = nilaiTemuan - totalLaporanLain - Number(jumlahValue || 0);

  function openModal() {
    setAksiValue(aksi);
    setJumlahValue(String(jumlahSetor));
    setFiles([]);
    setMessage("");
    setIsOpen(true);
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const valid: File[] = [];
    let error = "";
    for (const file of Array.from(event.target.files ?? [])) {
      if (!ALLOWED_TYPES.includes(file.type)) error = `${file.name}: format file tidak didukung.`;
      else if (file.size === 0 || file.size > MAX_FILE_SIZE) error = `${file.name}: ukuran file harus antara 1 byte sampai 4 MB.`;
      else valid.push(file);
    }
    setFiles((previous) => {
      const combined = [...previous, ...valid];
      if (combined.length > MAX_FILES) error = `Maksimal ${MAX_FILES} file tambahan.`;
      return combined.slice(0, MAX_FILES);
    });
    setMessage(error);
    event.target.value = "";
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;
    if (!aksiValue.trim()) return setMessage("Aksi tindak lanjut wajib diisi.");
    if (!/^(?:0|[1-9]\d{0,17})(?:\.\d{1,2})?$/.test(jumlahValue)) return setMessage("Jumlah setor tidak valid.");
    if (sisaSetelahEdit < 0) return setMessage("Jumlah setor melebihi sisa kewajiban temuan.");

    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.set("laporanId", laporanId);
      formData.set("aksiTindakLanjut", aksiValue);
      formData.set("jumlahSetor", jumlahValue);
      const result = await updateTindakLanjutAction(formData);
      if (!result.success) throw new Error(result.message);

      let failed = 0;
      for (const file of files) {
        try {
          const uploadData = new FormData();
          uploadData.append("file", file);
          uploadData.append("laporanId", laporanId);
          const response = await fetch("/api/bukti-dukung", { method: "POST", body: uploadData });
          const uploadResult = await response.json();
          if (!response.ok || !uploadResult.success) throw new Error(uploadResult.message || "Upload gagal.");
        } catch (error) {
          failed++;
          console.error(`Upload ${file.name} gagal:`, error);
        }
      }

      router.refresh();
      if (failed > 0) {
        setMessage(`Laporan berhasil diperbarui, tetapi ${failed} file gagal diunggah. Anda dapat memilih file tersebut kembali.`);
      } else {
        setIsOpen(false);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Terjadi kesalahan saat memperbarui laporan.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <button type="button" onClick={openModal} className="inline-flex items-center gap-1.5 rounded-lg border border-[#15406A]/20 px-2.5 py-1.5 text-xs font-semibold text-[#15406A] transition hover:bg-blue-50">
        <Pencil size={13} /> Edit
      </button>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
            <motion.button
              type="button"
              aria-label="Tutup modal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isSaving && setIsOpen(false)}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              role="dialog"
              aria-modal="true"
              className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Edit Laporan Tindak Lanjut</h2>
                  <p className="mt-1 text-sm text-slate-500">Perubahan hanya berlaku untuk laporan ini.</p>
                </div>
                <button type="button" onClick={() => setIsOpen(false)} disabled={isSaving} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100" aria-label="Tutup">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-5 overflow-y-auto px-6 py-5">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Informasi Temuan</p>
                  <p className="mt-2 whitespace-pre-line text-sm text-slate-700">{kondisi}</p>
                  <div className="mt-3 grid grid-cols-2 gap-3 border-t border-slate-200 pt-3">
                    <div>
                      <p className="text-xs text-slate-500">Nilai Temuan</p>
                      <p className="mt-1 text-sm font-semibold">{formatRupiah(nilaiTemuan)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Setoran laporan lain</p>
                      <p className="mt-1 text-sm font-semibold text-emerald-700">{formatRupiah(totalLaporanLain)}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor={`edit-aksi-${laporanId}`}>
                    Aksi Tindak Lanjut *
                  </label>
                  <textarea
                    id={`edit-aksi-${laporanId}`}
                    rows={5}
                    maxLength={30000}
                    required
                    value={aksiValue}
                    onChange={(event) => setAksiValue(event.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-[#15406A]"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor={`edit-setor-${laporanId}`}>
                    Jumlah Setor (Rp) *
                  </label>
                  <input
                    id={`edit-setor-${laporanId}`}
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={jumlahValue}
                    onChange={(event) => setJumlahValue(event.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-[#15406A]"
                  />
                </div>
                <div className="rounded-lg bg-amber-50 p-3">
                  <p className="text-xs text-slate-500">Sisa kewajiban setelah perubahan</p>
                  <p className={`mt-1 text-sm font-bold ${sisaSetelahEdit < 0 ? "text-rose-600" : "text-amber-700"}`}>{formatRupiah(sisaSetelahEdit)}</p>
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-700">Tambah Bukti Dukung</p>
                    <span className="text-xs text-slate-400">Maks. 10 file, 4 MB/file</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isSaving || files.length >= MAX_FILES}
                    className="flex w-full flex-col items-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm hover:border-[#15406A]"
                  >
                    <UploadCloud size={24} className="mb-2 text-[#15406A]" />
                    Pilih file bukti dukung
                  </button>
                  <input ref={fileInputRef} type="file" multiple accept=".jpg,.jpeg,.png,.webp,.pdf" onChange={handleFileChange} className="hidden" />
                  {files.map((file, index) => (
                    <div key={`${file.name}-${index}`} className="mt-2 flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
                      {file.type === "application/pdf" ? <FileText size={17} /> : <ImageIcon size={17} />}
                      <span className="min-w-0 flex-1 truncate text-xs">{file.name}</span>
                      <button type="button" onClick={() => setFiles((previous) => previous.filter((_, i) => i !== index))} aria-label="Hapus file">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
                {message && (
                  <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {message}
                  </div>
                )}
                <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
                  <button type="button" onClick={() => setIsOpen(false)} disabled={isSaving} className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-600">
                    Batal
                  </button>
                  <button type="submit" disabled={isSaving || sisaSetelahEdit < 0} className="inline-flex items-center gap-2 rounded-xl bg-[#15406A] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
                    {isSaving ? (
                      <>
                        <LoaderCircle size={17} className="animate-spin" /> Menyimpan...
                      </>
                    ) : (
                      <>
                        <Save size={17} /> Simpan Perubahan
                      </>
                    )}
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

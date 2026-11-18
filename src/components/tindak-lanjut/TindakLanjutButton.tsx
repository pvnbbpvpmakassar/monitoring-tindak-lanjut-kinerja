
"use client";

import { useState } from "react";
import { ClipboardEdit, Plus } from "lucide-react";
import TindakLanjutModal from "@/components/tindak-lanjut/TindakLanjutModal";

interface TindakLanjutButtonProps {
  temuanId: string;
  kondisi: string;
  nilaiTemuan: number;
  aksiTindakLanjut: string | null;
  jumlahSetor: number;
  sudahAdaLaporan: boolean;
}

export default function TindakLanjutButton({
  temuanId,
  kondisi,
  nilaiTemuan,
  aksiTindakLanjut,
  jumlahSetor,
  sudahAdaLaporan,
}: TindakLanjutButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-[#15406A] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[#103454]"
      >
        {sudahAdaLaporan ? (
          <>
            <ClipboardEdit size={15} />
            Edit Tindak Lanjut
          </>
        ) : (
          <>
            <Plus size={15} />
            Isi Tindak Lanjut
          </>
        )}
      </button>

      <TindakLanjutModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        temuanId={temuanId}
        kondisi={kondisi}
        nilaiTemuan={nilaiTemuan}
        initialAksi={aksiTindakLanjut}
        initialJumlahSetor={jumlahSetor}
      />
    </>
  );
}

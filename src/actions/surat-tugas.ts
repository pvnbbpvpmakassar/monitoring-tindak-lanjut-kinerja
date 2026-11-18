
"use server";

import { revalidatePath } from "next/cache";

import { sql } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth/session";

export interface SuratTugasState {
  status: "idle" | "success" | "error";
  message: string;
}

export async function saveSuratTugasAction(
  _prevState: SuratTugasState,
  formData: FormData
): Promise<SuratTugasState> {
  try {
    const admin = await getCurrentAdmin();

    if (!admin) {
      return {
        status: "error",
        message: "Sesi Admin tidak ditemukan. Silakan login kembali.",
      };
    }

    const tahun = Number(formData.get("tahun"));
    const nomorSurat = String(formData.get("nomor_surat") ?? "").trim();

    if (
      !Number.isInteger(tahun) ||
      tahun < 2020 ||
      tahun > 2030
    ) {
      return {
        status: "error",
        message: "Tahun anggaran tidak valid.",
      };
    }

    if (!nomorSurat) {
      return {
        status: "error",
        message: "Nomor Surat Tugas wajib diisi.",
      };
    }

    if (nomorSurat.length > 255) {
      return {
        status: "error",
        message: "Nomor Surat Tugas maksimal 255 karakter.",
      };
    }

    await sql`
      INSERT INTO surat_tugas (
        tahun,
        nomor_surat
      )
      VALUES (
        ${tahun},
        ${nomorSurat}
      )
      ON CONFLICT (tahun)
      DO UPDATE SET
        nomor_surat = EXCLUDED.nomor_surat,
        updated_at = NOW()
    `;

    revalidatePath("/tindak-lanjut");

    return {
      status: "success",
      message: "Nomor Surat Tugas berhasil disimpan.",
    };
  } catch (error) {
    console.error("SAVE_SURAT_TUGAS_ERROR:", error);

    return {
      status: "error",
      message: "Terjadi kesalahan saat menyimpan Surat Tugas.",
    };
  }
}

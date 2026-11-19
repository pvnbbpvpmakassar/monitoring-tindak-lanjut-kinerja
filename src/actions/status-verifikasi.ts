"use server";

import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth/session";

export type VerificationStatus = "Sesuai" | "Tidak Sesuai";

export interface StatusVerifikasiState {
  status: "success" | "error";
  message: string;
  tanggalVerifikasi?: string;
  diverifikasiOleh?: string;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function updateVerificationStatusAction(laporanId: string, status: VerificationStatus): Promise<StatusVerifikasiState> {
  const admin = await getCurrentAdmin();

  if (!admin) {
    return {
      status: "error",
      message: "Sesi Admin tidak ditemukan. Silakan login kembali.",
    };
  }

  if (!UUID_REGEX.test(laporanId)) {
    return {
      status: "error",
      message: "ID laporan tindak lanjut tidak valid.",
    };
  }

  if (status !== "Sesuai" && status !== "Tidak Sesuai") {
    return {
      status: "error",
      message: "Pilihan status verifikasi tidak valid.",
    };
  }

  try {
    const result = await sql`
      UPDATE laporan_tindak_lanjut
      SET
        status_verifikasi = ${status},
        diverifikasi_oleh = ${admin.id},
        tanggal_verifikasi = NOW(),
        updated_at = NOW()
      WHERE id = ${laporanId}
      RETURNING tanggal_verifikasi
    `;

    if (result.length === 0) {
      return {
        status: "error",
        message: "Laporan tindak lanjut tidak ditemukan.",
      };
    }

    revalidatePath("/tindak-lanjut", "page");
    revalidatePath("/dashboard", "page");

    return {
      status: "success",
      message: "Status verifikasi berhasil diperbarui.",
      tanggalVerifikasi: new Date(result[0].tanggal_verifikasi).toISOString(),
      diverifikasiOleh: admin.nama,
    };
  } catch (error) {
    console.error("Gagal memperbarui status verifikasi:", error);

    return {
      status: "error",
      message: "Terjadi kesalahan saat memperbarui status verifikasi.",
    };
  }
}

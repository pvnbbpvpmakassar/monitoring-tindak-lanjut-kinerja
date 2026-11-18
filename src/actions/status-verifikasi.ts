"use server";

import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth/session";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function updateStatusVerifikasiAction(
  temuanId: string,
  status: "Sesuai" | "Tidak Sesuai"
) {
  const admin = await getCurrentAdmin();

  if (!admin) {
    return {
      success: false,
      message: "Sesi Admin tidak ditemukan.",
    };
  }

  if (!UUID_REGEX.test(temuanId)) {
    return {
      success: false,
      message: "ID temuan tidak valid.",
    };
  }

  if (status !== "Sesuai" && status !== "Tidak Sesuai") {
    return {
      success: false,
      message: "Status verifikasi tidak valid.",
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
      WHERE temuan_id = ${temuanId}
      RETURNING id
    `;

    if (result.length === 0) {
      return {
        success: false,
        message: "Data tindak lanjut belum tersedia.",
      };
    }

    revalidatePath("/tindak-lanjut");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: `Status berhasil diubah menjadi ${status}.`,
    };
  } catch (error) {
    console.error("Gagal memperbarui status verifikasi:", error);

    return {
      success: false,
      message: "Terjadi kesalahan saat memperbarui status.",
    };
  }
}
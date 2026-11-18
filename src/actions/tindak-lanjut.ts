"use server";

import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth/session";

export interface TindakLanjutState {
  status: "idle" | "success" | "error";
  message: string;
  laporanId: string | null;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function validateInput(formData: FormData) {
  const temuanId = String(formData.get("temuanId") ?? "").trim();
  const aksi = String(formData.get("aksiTindakLanjut") ?? "").trim();
  const jumlahSetor = String(formData.get("jumlahSetor") ?? "")
    .replace(/\s/g, "")
    .replace(/,/g, ".");

  if (!UUID_REGEX.test(temuanId)) {
    return { error: "ID temuan tidak valid." };
  }

  if (!aksi) {
    return { error: "Aksi tindak lanjut wajib diisi." };
  }

  if (aksi.length > 30000) {
    return { error: "Aksi tindak lanjut maksimal 30.000 karakter." };
  }

  if (!/^(?:0|[1-9]\d{0,17})(?:\.\d{1,2})?$/.test(jumlahSetor)) {
    return {
      error: "Jumlah setor harus berupa angka dengan maksimal dua angka desimal.",
    };
  }

  return { temuanId, aksi, jumlahSetor };
}

export async function saveTindakLanjutAction(_previousState: TindakLanjutState, formData: FormData): Promise<TindakLanjutState> {
  const admin = await getCurrentAdmin();

  if (!admin) {
    return {
      status: "error",
      message: "Sesi Admin tidak ditemukan. Silakan login kembali.",
      laporanId: null,
    };
  }

  const input = validateInput(formData);

  if ("error" in input) {
    return {
      status: "error",
      message: input.error ?? "Data yang dimasukkan tidak valid.",
      laporanId: null,
    };
  }

  try {
    const temuan = await sql`
      SELECT id
      FROM temuan
      WHERE id = ${input.temuanId}
      LIMIT 1
    `;

    if (temuan.length === 0) {
      return {
        status: "error",
        message: "Data temuan tidak ditemukan.",
        laporanId: null,
      };
    }

    const result = await sql`
      INSERT INTO laporan_tindak_lanjut (
        temuan_id,
        aksi_tindak_lanjut,
        jumlah_setor
      )
      VALUES (
        ${input.temuanId},
        ${input.aksi},
        ${input.jumlahSetor}
      )
      ON CONFLICT (temuan_id)
      DO UPDATE SET
        aksi_tindak_lanjut = EXCLUDED.aksi_tindak_lanjut,
        jumlah_setor = EXCLUDED.jumlah_setor,
        updated_at = NOW()
      RETURNING id
    `;

    revalidatePath("/tindak-lanjut");
    revalidatePath("/dashboard");

    return {
      status: "success",
      message: "Tindak lanjut berhasil disimpan.",
      laporanId: String(result[0].id),
    };
  } catch (error) {
    console.error("Gagal menyimpan tindak lanjut:", error);

    return {
      status: "error",
      message: "Terjadi kesalahan saat menyimpan tindak lanjut.",
      laporanId: null,
    };
  }
}


"use server";

import { revalidatePath } from "next/cache";
import sanitizeHtml from "sanitize-html";

import { sql } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth/session";

export interface TemuanState {
  status: "idle" | "success" | "error";
  message: string;
}

export async function createTemuanAction(
  _prevState: TemuanState,
  formData: FormData
): Promise<TemuanState> {
  try {
    const admin = await getCurrentAdmin();

    if (!admin) {
      return {
        status: "error",
        message: "Sesi Admin tidak ditemukan. Silakan login kembali.",
      };
    }

    const tahun = Number(formData.get("tahun"));
    const kondisi = String(formData.get("kondisi") ?? "").trim();
    const rekomendasiRaw = String(formData.get("rekomendasi") ?? "");
    const nilaiTemuan = String(formData.get("nilai_temuan") ?? "").trim();

    if (!Number.isInteger(tahun) || tahun < 2020 || tahun > 2030) {
      return {
        status: "error",
        message: "Tahun anggaran tidak valid.",
      };
    }

    if (!kondisi) {
      return {
        status: "error",
        message: "Kondisi temuan wajib diisi.",
      };
    }

    if (kondisi.length > 10000) {
      return {
        status: "error",
        message: "Kondisi temuan maksimal 10.000 karakter.",
      };
    }

    const rekomendasi = sanitizeHtml(rekomendasiRaw, {
      allowedTags: [
        "p", "br", "strong", "b", "em", "i", "s",
        "ul", "ol", "li",
        "h1", "h2", "h3", "h4", "h5", "h6",
        "blockquote", "pre", "code", "hr",
      ],
      allowedAttributes: {},
    });

    const rekomendasiText = sanitizeHtml(rekomendasi, {
      allowedTags: [],
      allowedAttributes: {},
    }).trim();

    if (!rekomendasiText) {
      return {
        status: "error",
        message: "Rekomendasi wajib diisi.",
      };
    }

    if (rekomendasi.length > 30000) {
      return {
        status: "error",
        message: "Rekomendasi terlalu panjang.",
      };
    }

    // Numeric(20,2): maksimal 18 digit sebelum koma dan 2 digit desimal.
    if (!/^(?:0|[1-9]\d{0,17})(?:\.\d{1,2})?$/.test(nilaiTemuan)) {
      return {
        status: "error",
        message: "Nilai temuan tidak valid. Gunakan angka dengan maksimal 2 desimal.",
      };
    }

    const suratTugas = await sql`
      SELECT id
      FROM surat_tugas
      WHERE tahun = ${tahun}
      LIMIT 1
    `;

    if (suratTugas.length === 0) {
      return {
        status: "error",
        message: `Nomor Surat Tugas tahun ${tahun} belum diatur.`,
      };
    }

    await sql`
      INSERT INTO temuan (
        surat_tugas_id,
        kondisi,
        rekomendasi,
        nilai_temuan,
        created_by
      )
      VALUES (
        ${suratTugas[0].id},
        ${kondisi},
        ${rekomendasi},
        ${nilaiTemuan},
        ${admin.id}
      )
    `;

    revalidatePath("/tindak-lanjut");

    return {
      status: "success",
      message: "Data temuan berhasil ditambahkan.",
    };
  } catch (error) {
    console.error("CREATE_TEMUAN_ERROR:", error);

    return {
      status: "error",
      message: "Terjadi kesalahan saat menyimpan data temuan.",
    };
  }
}

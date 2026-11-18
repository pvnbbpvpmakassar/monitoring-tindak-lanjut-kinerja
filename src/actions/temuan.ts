"use server";

import { revalidatePath } from "next/cache";
import sanitizeHtml from "sanitize-html";
import { del } from "@vercel/blob";

import { sql } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth/session";

export interface TemuanState {
  status: "idle" | "success" | "error";
  message: string;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function sanitizeRekomendasi(raw: string): string {
  return sanitizeHtml(raw, {
    allowedTags: ["p", "br", "strong", "b", "em", "i", "s", "ul", "ol", "li", "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "pre", "code", "hr"],
    allowedAttributes: {},
  });
}

function validateTemuanInput(formData: FormData) {
  const kondisi = String(formData.get("kondisi") ?? "").trim();
  const rekomendasiRaw = String(formData.get("rekomendasi") ?? "");
  const nilaiTemuan = String(formData.get("nilai_temuan") ?? "").trim();

  if (!kondisi) {
    return {
      error: "Kondisi temuan wajib diisi.",
    };
  }

  if (kondisi.length > 10000) {
    return {
      error: "Kondisi temuan maksimal 10.000 karakter.",
    };
  }

  const rekomendasi = sanitizeRekomendasi(rekomendasiRaw);

  const rekomendasiText = sanitizeHtml(rekomendasi, {
    allowedTags: [],
    allowedAttributes: {},
  }).trim();

  if (!rekomendasiText) {
    return {
      error: "Rekomendasi wajib diisi.",
    };
  }

  if (rekomendasi.length > 30000) {
    return {
      error: "Rekomendasi terlalu panjang.",
    };
  }

  if (!/^(?:0|[1-9]\d{0,17})(?:\.\d{1,2})?$/.test(nilaiTemuan)) {
    return {
      error: "Nilai temuan tidak valid. Gunakan angka dengan maksimal 2 desimal.",
    };
  }

  return {
    kondisi,
    rekomendasi,
    nilaiTemuan,
  };
}

// =====================================================
// TAMBAH TEMUAN
// =====================================================

export async function createTemuanAction(_prevState: TemuanState, formData: FormData): Promise<TemuanState> {
  try {
    const admin = await getCurrentAdmin();

    if (!admin) {
      return {
        status: "error",
        message: "Sesi Admin tidak ditemukan. Silakan login kembali.",
      };
    }

    const tahun = Number(formData.get("tahun"));

    if (!Number.isInteger(tahun) || tahun < 2020 || tahun > 2030) {
      return {
        status: "error",
        message: "Tahun anggaran tidak valid.",
      };
    }

    const input = validateTemuanInput(formData);

    if ("error" in input) {
      return {
        status: "error",
        message: input.error ?? "Data yang dimasukkan tidak valid.",
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
        ${input.kondisi},
        ${input.rekomendasi},
        ${input.nilaiTemuan},
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

// =====================================================
// EDIT TEMUAN
// =====================================================

export async function updateTemuanAction(_prevState: TemuanState, formData: FormData): Promise<TemuanState> {
  try {
    const admin = await getCurrentAdmin();

    if (!admin) {
      return {
        status: "error",
        message: "Sesi Admin tidak ditemukan. Silakan login kembali.",
      };
    }

    const id = String(formData.get("id") ?? "").trim();

    if (!UUID_REGEX.test(id)) {
      return {
        status: "error",
        message: "Identitas temuan tidak valid.",
      };
    }

    const input = validateTemuanInput(formData);

    if ("error" in input) {
      return {
        status: "error",
        message: input.error ?? "Data yang dimasukkan tidak valid.",
      };
    }

    const result = await sql`
      UPDATE temuan
      SET
        kondisi = ${input.kondisi},
        rekomendasi = ${input.rekomendasi},
        nilai_temuan = ${input.nilaiTemuan},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING id
    `;

    if (result.length === 0) {
      return {
        status: "error",
        message: "Data temuan tidak ditemukan.",
      };
    }

    revalidatePath("/tindak-lanjut");

    return {
      status: "success",
      message: "Data temuan berhasil diperbarui.",
    };
  } catch (error) {
    console.error("UPDATE_TEMUAN_ERROR:", error);

    return {
      status: "error",
      message: "Terjadi kesalahan saat memperbarui data temuan.",
    };
  }
}

// =====================================================
// HAPUS TEMUAN
// =====================================================

export async function deleteTemuanAction(id: string): Promise<TemuanState> {
  try {
    const admin = await getCurrentAdmin();

    if (!admin) {
      return {
        status: "error",
        message: "Sesi Admin tidak ditemukan. Silakan login kembali.",
      };
    }

    if (!UUID_REGEX.test(id)) {
      return {
        status: "error",
        message: "Identitas temuan tidak valid.",
      };
    }

    // Ambil URL bukti dukung sebelum data terkait terhapus.
    const evidence = await sql`
      SELECT b.blob_url
      FROM bukti_dukung b
      INNER JOIN laporan_tindak_lanjut l
        ON l.id = b.laporan_id
      WHERE l.temuan_id = ${id}
    `;

    // Hapus temuan.
    // Relasi ON DELETE CASCADE akan menghapus laporan dan
    // metadata bukti dukung yang terhubung.
    const deleted = await sql`
      DELETE FROM temuan
      WHERE id = ${id}
      RETURNING id
    `;

    if (deleted.length === 0) {
      return {
        status: "error",
        message: "Data temuan tidak ditemukan atau sudah dihapus.",
      };
    }

    let warning = "";

    // Hapus file fisik dari Vercel Blob.
    if (evidence.length > 0) {
      const blobUrls = evidence.map((item) => String(item.blob_url));

      try {
        await del(blobUrls);
      } catch (error) {
        console.error("DELETE_TEMUAN_BLOB_ERROR:", error);

        warning = " Data temuan terhapus, tetapi sebagian file bukti dukung gagal dihapus dari penyimpanan.";
      }
    }

    revalidatePath("/tindak-lanjut");
    revalidatePath("/dashboard");

    return {
      status: "success",
      message: `Data temuan dan seluruh data terkait berhasil dihapus.${warning}`,
    };
  } catch (error) {
    console.error("DELETE_TEMUAN_ERROR:", error);

    return {
      status: "error",
      message: "Terjadi kesalahan saat menghapus data temuan.",
    };
  }
}

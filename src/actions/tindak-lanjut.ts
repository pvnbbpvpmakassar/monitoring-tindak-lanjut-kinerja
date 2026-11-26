"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";

import { sql } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth/session";

export interface TindakLanjutInput {
  aksiTindakLanjut: string;
  jumlahSetor: string;
}

export interface TindakLanjutState {
  status: "idle" | "success" | "error";
  message: string;
  laporanId: string | null;
  laporanIds?: string[];
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const AMOUNT_REGEX = /^(?:0|[1-9]\d{0,17})(?:\.\d{1,2})?$/;

/**
 * Menyimpan beberapa laporan tindak lanjut sekaligus.
 * Total seluruh setoran tidak boleh melebihi nilai temuan.
 * Urutan laporan mengikuti urutan form yang dikirim.
 */
export async function saveTindakLanjutAction(_previousState: TindakLanjutState, formData: FormData): Promise<TindakLanjutState> {
  const admin = await getCurrentAdmin();

  if (!admin) {
    return {
      status: "error",
      message: "Sesi Admin tidak ditemukan. Silakan login kembali.",
      laporanId: null,
    };
  }

  const temuanId = String(formData.get("temuanId") ?? "").trim();

  let reports: TindakLanjutInput[];

  try {
    reports = JSON.parse(String(formData.get("reports") ?? "[]"));
  } catch {
    return {
      status: "error",
      message: "Format data tindak lanjut tidak valid.",
      laporanId: null,
    };
  }

  if (!UUID_REGEX.test(temuanId)) {
    return {
      status: "error",
      message: "ID temuan tidak valid.",
      laporanId: null,
    };
  }

  if (!Array.isArray(reports) || reports.length === 0 || reports.length > 20) {
    return {
      status: "error",
      message: "Tambahkan minimal satu dan maksimal 20 form tindak lanjut.",
      laporanId: null,
    };
  }

  const normalized: {
    id: string;
    aksi: string;
    jumlahSetor: string;
  }[] = [];

  for (let index = 0; index < reports.length; index++) {
    const aksi = String(reports[index]?.aksiTindakLanjut ?? "").trim();

    const jumlahSetor = String(reports[index]?.jumlahSetor ?? "")
      .replace(/\s/g, "")
      .replace(/,/g, ".");

    if (!aksi) {
      return {
        status: "error",
        message: `Aksi tindak lanjut pada form ${index + 1} wajib diisi.`,
        laporanId: null,
      };
    }

    if (aksi.length > 30000) {
      return {
        status: "error",
        message: `Aksi tindak lanjut pada form ${index + 1} maksimal 30.000 karakter.`,
        laporanId: null,
      };
    }

    if (!AMOUNT_REGEX.test(jumlahSetor)) {
      return {
        status: "error",
        message: `Jumlah setor pada form ${index + 1} tidak valid. Gunakan angka dengan maksimal dua desimal.`,
        laporanId: null,
      };
    }

    normalized.push({
      id: randomUUID(),
      aksi,
      jumlahSetor,
    });
  }

  try {
    // Advisory lock memastikan dua proses penyimpanan untuk temuan
    // yang sama tidak menghitung total setoran secara bersamaan.
    const result = await sql`
      WITH lock_row AS MATERIALIZED (
        SELECT pg_advisory_xact_lock(
          hashtextextended(${temuanId}, 0)
        )
      ),

      target AS MATERIALIZED (
        SELECT
          t.id,
          COALESCE(t.nilai_temuan, 0)::numeric AS nilai_temuan
        FROM temuan t, lock_row
        WHERE t.id = ${temuanId}
      ),

      current_total AS MATERIALIZED (
        SELECT
          COALESCE(SUM(l.jumlah_setor), 0)::numeric AS total
        FROM laporan_tindak_lanjut l
        JOIN target t ON t.id = l.temuan_id
      ),

      next_order AS MATERIALIZED (
        SELECT
          COALESCE(MAX(l.urutan), 0)::integer AS max_urutan
        FROM laporan_tindak_lanjut l
        JOIN target t ON t.id = l.temuan_id
      ),

      incoming AS MATERIALIZED (
        SELECT
          x.id,
          x.aksi,
          x."jumlahSetor",
          x.ordinality
        FROM jsonb_to_recordset(
          ${JSON.stringify(normalized)}::jsonb
        )
        WITH ORDINALITY AS x(
          id uuid,
          aksi text,
          "jumlahSetor" numeric,
          ordinality bigint
        )
      ),

      validation AS MATERIALIZED (
        SELECT
          target.id,
          target.nilai_temuan,
          current_total.total,
          COALESCE(
            (
              SELECT SUM(i."jumlahSetor")
              FROM incoming i
            ),
            0
          )::numeric AS incoming_total
        FROM target
        CROSS JOIN current_total
      ),

      inserted AS (
        INSERT INTO laporan_tindak_lanjut (
          id,
          temuan_id,
          aksi_tindak_lanjut,
          jumlah_setor,
          urutan
        )
        SELECT
          incoming.id,
          validation.id,
          incoming.aksi,
          incoming."jumlahSetor",
          next_order.max_urutan + incoming.ordinality::integer
        FROM validation
        CROSS JOIN incoming
        CROSS JOIN next_order
        WHERE
          validation.total + validation.incoming_total
          <= validation.nilai_temuan
        ORDER BY incoming.ordinality
        RETURNING id
      )

      SELECT
        (SELECT COUNT(*) FROM target) AS target_count,
        (SELECT nilai_temuan FROM validation) AS nilai_temuan,
        (SELECT total FROM validation) AS total_sebelumnya,
        (SELECT incoming_total FROM validation) AS total_baru,
        (SELECT COUNT(*) FROM inserted) AS inserted_count
    `;

    const row = result[0];

    if (Number(row.target_count) === 0) {
      return {
        status: "error",
        message: "Data temuan tidak ditemukan.",
        laporanId: null,
      };
    }

    const laporanIds = normalized.map((report) => report.id);

    if (Number(row.inserted_count) !== normalized.length) {
      const sisa = Math.max(0, Number(row.nilai_temuan) - Number(row.total_sebelumnya));

      const formatter = new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 2,
      });

      return {
        status: "error",
        message: `Total setoran melebihi nilai temuan. ` + `Sisa kewajiban saat ini ${formatter.format(sisa)}. ` + `Total yang akan ditambahkan ${formatter.format(Number(row.total_baru))}. ` + "Tidak ada laporan yang disimpan.",
        laporanId: null,
      };
    }

    revalidatePath("/tindak-lanjut", "page");
    revalidatePath("/dashboard");

    return {
      status: "success",
      message: `${laporanIds.length} laporan tindak lanjut berhasil disimpan.`,
      laporanId: laporanIds[0] ?? null,
      laporanIds,
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

/**
 * Memperbarui satu laporan tindak lanjut.
 * Perhitungan batas setoran tetap memperhitungkan laporan lainnya.
 */
export async function updateTindakLanjutAction(formData: FormData): Promise<{ success: boolean; message: string }> {
  const admin = await getCurrentAdmin();

  if (!admin) {
    return {
      success: false,
      message: "Sesi Admin tidak ditemukan. Silakan login kembali.",
    };
  }

  const laporanId = String(formData.get("laporanId") ?? "").trim();

  const aksi = String(formData.get("aksiTindakLanjut") ?? "").trim();

  const jumlahSetor = String(formData.get("jumlahSetor") ?? "")
    .replace(/\s/g, "")
    .replace(/,/g, ".");

  if (!UUID_REGEX.test(laporanId)) {
    return {
      success: false,
      message: "ID laporan tidak valid.",
    };
  }

  if (!aksi || aksi.length > 30000) {
    return {
      success: false,
      message: "Aksi tindak lanjut wajib diisi dan maksimal 30.000 karakter.",
    };
  }

  if (!AMOUNT_REGEX.test(jumlahSetor)) {
    return {
      success: false,
      message: "Jumlah setor tidak valid. Gunakan angka dengan maksimal dua desimal.",
    };
  }

  try {
    const result = await sql`
      WITH report_target AS MATERIALIZED (
        SELECT
          l.id,
          l.temuan_id
        FROM laporan_tindak_lanjut l
        WHERE l.id = ${laporanId}
      ),

      lock_row AS MATERIALIZED (
        SELECT
          pg_advisory_xact_lock(
            hashtextextended(rt.temuan_id::text, 0)
          )
        FROM report_target rt
      ),

      target AS MATERIALIZED (
        SELECT
          t.id,
          COALESCE(t.nilai_temuan, 0)::numeric AS nilai_temuan
        FROM temuan t
        JOIN report_target rt ON rt.temuan_id = t.id
        CROSS JOIN lock_row
      ),

      current_total AS MATERIALIZED (
        SELECT
          COALESCE(SUM(l.jumlah_setor), 0)::numeric AS total
        FROM laporan_tindak_lanjut l
        JOIN target t ON t.id = l.temuan_id
        WHERE l.id <> ${laporanId}
      ),

      updated AS (
        UPDATE laporan_tindak_lanjut l
        SET
          aksi_tindak_lanjut = ${aksi},
          jumlah_setor = ${jumlahSetor}::numeric,
          updated_at = NOW()
        FROM target t, current_total ct
        WHERE
          l.id = ${laporanId}
          AND l.temuan_id = t.id
          AND ct.total + ${jumlahSetor}::numeric <= t.nilai_temuan
        RETURNING l.id
      )

      SELECT
        (SELECT COUNT(*) FROM report_target) AS report_count,
        (SELECT nilai_temuan FROM target) AS nilai_temuan,
        (SELECT total FROM current_total) AS total_lainnya,
        (SELECT COUNT(*) FROM updated) AS updated_count
    `;

    const row = result[0];

    if (Number(row.report_count) === 0) {
      return {
        success: false,
        message: "Laporan tindak lanjut tidak ditemukan.",
      };
    }

    if (Number(row.updated_count) === 0) {
      const sisa = Math.max(0, Number(row.nilai_temuan) - Number(row.total_lainnya));

      return {
        success: false,
        message:
          `Jumlah setor melebihi sisa kewajiban. ` +
          `Maksimal yang dapat dimasukkan ${new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 2,
          }).format(sisa)}.`,
      };
    }

    revalidatePath("/tindak-lanjut", "page");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: "Laporan tindak lanjut berhasil diperbarui.",
    };
  } catch (error) {
    console.error("Gagal memperbarui tindak lanjut:", error);

    return {
      success: false,
      message: "Terjadi kesalahan saat memperbarui tindak lanjut.",
    };
  }
}

/**
 * Menghapus satu laporan tindak lanjut beserta seluruh bukti dukungnya.
 */
export async function deleteTindakLanjutAction(laporanId: string): Promise<{ success: boolean; message: string }> {
  const admin = await getCurrentAdmin();

  if (!admin) {
    return {
      success: false,
      message: "Sesi Admin tidak ditemukan. Silakan login kembali.",
    };
  }

  if (!UUID_REGEX.test(laporanId)) {
    return {
      success: false,
      message: "ID laporan tindak lanjut tidak valid.",
    };
  }

  try {
    // Simpan informasi laporan terlebih dahulu.
    const reportRows = await sql`
      SELECT id, temuan_id
      FROM laporan_tindak_lanjut
      WHERE id = ${laporanId}
      LIMIT 1
    `;

    if (reportRows.length === 0) {
      return {
        success: false,
        message: "Laporan tindak lanjut tidak ditemukan.",
      };
    }

    // Simpan URL Blob sebelum metadata bukti dukung dihapus.
    const evidenceRows = await sql`
      SELECT blob_url
      FROM bukti_dukung
      WHERE laporan_id = ${laporanId}
    `;

    // Hapus metadata bukti dukung dan laporan dalam satu transaksi.
    const transactionResults = await sql.transaction([
      sql`
        DELETE FROM bukti_dukung
        WHERE laporan_id = ${laporanId}
      `,
      sql`
        DELETE FROM laporan_tindak_lanjut
        WHERE id = ${laporanId}
        RETURNING id, temuan_id
      `,
    ]);

    const deletedReports = transactionResults[1] as Array<{
      id: string;
      temuan_id: string;
    }>;

    if (!deletedReports || deletedReports.length === 0) {
      return {
        success: false,
        message: "Laporan tindak lanjut gagal dihapus.",
      };
    }

    // Hapus file fisik setelah transaksi database berhasil.
    // Kegagalan penghapusan Blob tidak membatalkan penghapusan database.
    const blobUrls = evidenceRows.map((row) => String(row.blob_url ?? "")).filter((url) => url.length > 0);

    if (blobUrls.length > 0) {
      const { del } = await import("@vercel/blob");

      const deleteResults = await Promise.allSettled(blobUrls.map((url) => del(url)));

      const failedFiles = deleteResults.filter((result) => result.status === "rejected").length;

      if (failedFiles > 0) {
        console.error(`${failedFiles} file bukti dukung gagal dihapus dari Vercel Blob.`);
      }
    }

    revalidatePath("/tindak-lanjut", "page");
    revalidatePath("/dashboard", "page");

    return {
      success: true,
      message: "Laporan tindak lanjut dan data bukti dukungnya berhasil dihapus.",
    };
  } catch (error) {
    console.error("Gagal menghapus tindak lanjut:", error);

    return {
      success: false,
      message: "Terjadi kesalahan saat menghapus tindak lanjut.",
    };
  }
}

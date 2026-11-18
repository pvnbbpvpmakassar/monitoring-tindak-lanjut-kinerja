import "server-only";

import { sql } from "@/lib/db";

export interface DashboardSummary {
  belumDitindaklanjuti: number;
  belumSesuai: number;
  sesuai: number;
  sisaKewajiban: number;
}

export async function getDashboardSummary(tahun: number | null): Promise<DashboardSummary> {
  const result = await sql`
    SELECT
      COUNT(*) FILTER (
        WHERE status_tindak_lanjut = 'Belum Ditindak Lanjut'
      ) AS belum_ditindaklanjuti,

      COUNT(*) FILTER (
        WHERE status_verifikasi = 'Belum Sesuai'
      ) AS belum_sesuai,

      COUNT(*) FILTER (
        WHERE status_verifikasi = 'Sesuai'
      ) AS sesuai,

      COALESCE(
        SUM(GREATEST(sisa, 0)),
        0
      ) AS sisa_kewajiban

    FROM v_monitoring_tindak_lanjut

    WHERE (
      ${tahun}::INTEGER IS NULL
      OR tahun = ${tahun}
    )
  `;

  const row = result[0];

  return {
    belumDitindaklanjuti: Number(row.belum_ditindaklanjuti ?? 0),
    belumSesuai: Number(row.belum_sesuai ?? 0),
    sesuai: Number(row.sesuai ?? 0),
    sisaKewajiban: Number(row.sisa_kewajiban ?? 0),
  };
}

export interface TindakLanjutRow {
  id: string;
  kondisi: string;
  rekomendasi: string;
  nilai_temuan: number;
  aksi_tindak_lanjut: string | null;
  jumlah_setor: number;
  sisa: number;
  status_verifikasi: "Sesuai" | "Belum Sesuai" | null;
  status_tindak_lanjut: string;
  created_at: string;
}

export interface SuratTugasData {
  id: string;
  tahun: number;
  nomor_surat: string;
}

export async function getSuratTugasByYear(tahun: number): Promise<SuratTugasData | null> {
  const result = await sql`
    SELECT id, tahun, nomor_surat
    FROM surat_tugas
    WHERE tahun = ${tahun}
    LIMIT 1
  `;

  return (result[0] as SuratTugasData | undefined) ?? null;
}

export async function getTindakLanjutByYear(tahun: number): Promise<TindakLanjutRow[]> {
  const result = await sql`
    SELECT
      temuan_id,
      kondisi,
      rekomendasi,
      nilai_temuan,
      aksi_tindak_lanjut,
      jumlah_setor,
      sisa,
      status_verifikasi,
      status_tindak_lanjut
    FROM v_monitoring_tindak_lanjut
    WHERE tahun = ${tahun}
    ORDER BY temuan_id DESC
  `;

  return result.map((row) => ({
    id: String(row.temuan_id),
    kondisi: String(row.kondisi),
    rekomendasi: String(row.rekomendasi ?? ""),
    nilai_temuan: Number(row.nilai_temuan ?? 0),
    aksi_tindak_lanjut: row.aksi_tindak_lanjut ? String(row.aksi_tindak_lanjut) : null,
    jumlah_setor: Number(row.jumlah_setor ?? 0),
    sisa: Number(row.sisa ?? 0),
    status_verifikasi: (row.status_verifikasi as "Sesuai" | "Belum Sesuai" | null) ?? null,
    status_tindak_lanjut: String(row.status_tindak_lanjut),
    created_at: "",
  }));
}

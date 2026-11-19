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
        WHERE status_verifikasi = 'Tidak Sesuai'
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
  status_verifikasi: "Sesuai" | "Tidak Sesuai" | null;
  status_tindak_lanjut: string;
  created_at: string;
  laporanId: string | null;
  tanggal_verifikasi: string | null;
  diverifikasi_oleh_nama: string | null;
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
      v.temuan_id,
      v.laporan_id,
      v.kondisi,
      v.rekomendasi,
      v.nilai_temuan,
      v.aksi_tindak_lanjut,
      v.jumlah_setor,
      v.sisa,
      v.status_verifikasi,
      v.status_tindak_lanjut,
      t.created_at,
      l.tanggal_verifikasi,
      a.nama AS diverifikasi_oleh_nama
    FROM v_monitoring_tindak_lanjut v
    INNER JOIN temuan t
      ON t.id = v.temuan_id
    LEFT JOIN laporan_tindak_lanjut l
      ON l.id = v.laporan_id
    LEFT JOIN admins a
      ON a.id = l.diverifikasi_oleh
    WHERE v.tahun = ${tahun}
    ORDER BY
      t.created_at ASC,
      v.temuan_id ASC
  `;

  return result.map((row) => ({
    id: String(row.temuan_id),
    kondisi: String(row.kondisi),
    rekomendasi: String(row.rekomendasi ?? ""),
    nilai_temuan: Number(row.nilai_temuan ?? 0),
    aksi_tindak_lanjut: row.aksi_tindak_lanjut ? String(row.aksi_tindak_lanjut) : null,
    jumlah_setor: Number(row.jumlah_setor ?? 0),
    sisa: Number(row.sisa ?? 0),
    status_verifikasi: (row.status_verifikasi as "Sesuai" | "Tidak Sesuai" | null) ?? null,
    status_tindak_lanjut: String(row.status_tindak_lanjut),
    created_at: String(row.created_at),
    laporanId: row.laporan_id ? String(row.laporan_id) : null,
    tanggal_verifikasi: row.tanggal_verifikasi ? new Date(row.tanggal_verifikasi).toISOString() : null,
    diverifikasi_oleh_nama: row.diverifikasi_oleh_nama ? String(row.diverifikasi_oleh_nama) : null,
  }));
}

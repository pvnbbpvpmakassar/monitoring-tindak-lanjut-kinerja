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
    WITH temuan_summary AS (
      SELECT
        temuan_id,
        MAX(sisa) AS sisa,
        BOOL_OR(status_tindak_lanjut = 'Belum Ditindak Lanjut') AS belum_ditindaklanjuti
      FROM v_monitoring_tindak_lanjut
      WHERE (${tahun}::INTEGER IS NULL OR tahun = ${tahun})
      GROUP BY temuan_id
    ),
    laporan_summary AS (
      SELECT
        COUNT(*) FILTER (WHERE status_verifikasi = 'Tidak Sesuai') AS belum_sesuai,
        COUNT(*) FILTER (WHERE status_verifikasi = 'Sesuai') AS sesuai
      FROM v_monitoring_tindak_lanjut
      WHERE (${tahun}::INTEGER IS NULL OR tahun = ${tahun})
        AND laporan_id IS NOT NULL
    )
    SELECT
      COUNT(*) FILTER (WHERE ts.belum_ditindaklanjuti) AS belum_ditindaklanjuti,
      ls.belum_sesuai,
      ls.sesuai,
      COALESCE(SUM(GREATEST(ts.sisa, 0)), 0) AS sisa_kewajiban
    FROM temuan_summary ts
    CROSS JOIN laporan_summary ls
    GROUP BY ls.belum_sesuai, ls.sesuai
  `;

  const row = result[0] ?? {};
  return {
    belumDitindaklanjuti: Number(row.belum_ditindaklanjuti ?? 0),
    belumSesuai: Number(row.belum_sesuai ?? 0),
    sesuai: Number(row.sesuai ?? 0),
    sisaKewajiban: Number(row.sisa_kewajiban ?? 0),
  };
}

export interface TindakLanjutReport {
  id: string;
  aksi_tindak_lanjut: string;
  jumlah_setor: number;
  status_verifikasi: "Sesuai" | "Tidak Sesuai" | null;
  tanggal_verifikasi: string | null;
  diverifikasi_oleh_nama: string | null;
}

export interface TindakLanjutRow {
  id: string;
  kondisi: string;
  rekomendasi: string;
  nilai_temuan: number;
  total_setor: number;
  sisa: number;
  status_tindak_lanjut: string;
  created_at: string;
  reports: TindakLanjutReport[];
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
      v.kondisi,
      v.rekomendasi,
      v.nilai_temuan,
      MAX(v.total_setor) AS total_setor,
      MAX(v.sisa) AS sisa,
      CASE WHEN COUNT(v.laporan_id) = 0 THEN 'Belum Ditindak Lanjut' ELSE 'Sudah Ditindak Lanjut' END AS status_tindak_lanjut,
      t.created_at,
      l.id AS laporan_id,
      l.aksi_tindak_lanjut,
      l.jumlah_setor,
      l.status_verifikasi,
      l.tanggal_verifikasi,
      a.nama AS diverifikasi_oleh_nama
    FROM v_monitoring_tindak_lanjut v
    INNER JOIN temuan t ON t.id = v.temuan_id
    LEFT JOIN laporan_tindak_lanjut l ON l.id = v.laporan_id
    LEFT JOIN admins a ON a.id = l.diverifikasi_oleh
    WHERE v.tahun = ${tahun}
    GROUP BY
      v.temuan_id, v.kondisi, v.rekomendasi, v.nilai_temuan, t.created_at,
      l.id, l.aksi_tindak_lanjut, l.jumlah_setor, l.status_verifikasi,
      l.tanggal_verifikasi, a.nama
    ORDER BY t.created_at ASC, v.temuan_id ASC, l.created_at ASC NULLS FIRST
  `;

  const grouped = new Map<string, TindakLanjutRow>();
  for (const row of result) {
    const id = String(row.temuan_id);
    if (!grouped.has(id)) {
      grouped.set(id, {
        id,
        kondisi: String(row.kondisi),
        rekomendasi: String(row.rekomendasi ?? ""),
        nilai_temuan: Number(row.nilai_temuan ?? 0),
        total_setor: Number(row.total_setor ?? 0),
        sisa: Number(row.sisa ?? 0),
        status_tindak_lanjut: String(row.status_tindak_lanjut),
        created_at: String(row.created_at),
        reports: [],
      });
    }

    if (row.laporan_id) {
      grouped.get(id)!.reports.push({
        id: String(row.laporan_id),
        aksi_tindak_lanjut: String(row.aksi_tindak_lanjut ?? ""),
        jumlah_setor: Number(row.jumlah_setor ?? 0),
        status_verifikasi: (row.status_verifikasi as "Sesuai" | "Tidak Sesuai" | null) ?? null,
        tanggal_verifikasi: row.tanggal_verifikasi ? new Date(row.tanggal_verifikasi).toISOString() : null,
        diverifikasi_oleh_nama: row.diverifikasi_oleh_nama ? String(row.diverifikasi_oleh_nama) : null,
      });
    }
  }

  return Array.from(grouped.values());
}

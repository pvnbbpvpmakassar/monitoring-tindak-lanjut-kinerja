import { connection } from "next/server";
import { put, del } from "@vercel/blob";
import { sql } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth/session";

const MAX_FILE_SIZE = 4 * 1024 * 1024;

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function validateFileSignature(file: File): Promise<boolean> {
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());

  switch (file.type) {
    case "image/jpeg":
      return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;

    case "image/png":
      return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a;

    case "image/webp":
      return new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" && new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP";

    case "application/pdf":
      return new TextDecoder().decode(bytes.slice(0, 5)) === "%PDF-";

    default:
      return false;
  }
}

export async function POST(request: Request) {
  await connection();

  const admin = await getCurrentAdmin();

  if (!admin) {
    return Response.json({ success: false, message: "Sesi Admin tidak ditemukan." }, { status: 401 });
  }

  let blob: Awaited<ReturnType<typeof put>> | null = null;

  try {
    const formData = await request.formData();

    const file = formData.get("file");
    const laporanId = formData.get("laporanId");

    if (!(file instanceof File)) {
      return Response.json({ success: false, message: "File tidak ditemukan." }, { status: 400 });
    }

    if (typeof laporanId !== "string" || !UUID_REGEX.test(laporanId)) {
      return Response.json({ success: false, message: "ID laporan tidak valid." }, { status: 400 });
    }

    if (file.size === 0) {
      return Response.json({ success: false, message: "File tidak boleh kosong." }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return Response.json(
        {
          success: false,
          message: "Ukuran maksimal setiap file adalah 4 MB.",
        },
        { status: 400 },
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return Response.json(
        {
          success: false,
          message: "Format file harus JPG, PNG, WEBP, atau PDF.",
        },
        { status: 400 },
      );
    }

    const validSignature = await validateFileSignature(file);

    if (!validSignature) {
      return Response.json(
        {
          success: false,
          message: "Isi file tidak sesuai dengan format yang dipilih.",
        },
        { status: 400 },
      );
    }

    // Pastikan laporan tindak lanjut tersedia.
    const laporan = await sql`
      SELECT id
      FROM laporan_tindak_lanjut
      WHERE id = ${laporanId}
      LIMIT 1
    `;

    if (laporan.length === 0) {
      return Response.json(
        {
          success: false,
          message: "Laporan tindak lanjut tidak ditemukan.",
        },
        { status: 404 },
      );
    }

    // Bersihkan nama file agar aman digunakan sebagai pathname.
    const originalName = file.name.split(/[\\/]/).pop() || "bukti-dukung";

    const safeFileName = originalName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100);

    const pathname = `bukti-dukung/${laporanId}/${crypto.randomUUID()}-${safeFileName}`;

    // Upload ke Private Blob.
    blob = await put(pathname, file, {
      access: "private",
      addRandomSuffix: false,
      contentType: file.type,
    });

    // Simpan metadata file ke database.
    const inserted = await sql`
      INSERT INTO bukti_dukung (
        laporan_id,
        nama_file,
        blob_url,
        tipe_file,
        ukuran_file,
        uploaded_by
      )
      VALUES (
        ${laporanId},
        ${originalName},
        ${blob.url},
        ${file.type},
        ${file.size},
        ${admin.id}
      )
      RETURNING id
    `;

    return Response.json({
      success: true,
      message: "Bukti dukung berhasil diunggah.",
      data: {
        id: String(inserted[0].id),
        nama_file: originalName,
        tipe_file: file.type,
        ukuran_file: file.size,
      },
    });
  } catch (error) {
    // Jika penyimpanan database gagal, hapus file yang sudah terunggah.
    if (blob) {
      try {
        await del(blob.url);
      } catch (deleteError) {
        console.error("Gagal membersihkan Blob setelah upload gagal:", deleteError);
      }
    }

    console.error("Upload bukti dukung gagal:", error);

    return Response.json(
      {
        success: false,
        message: "Terjadi kesalahan saat mengunggah bukti dukung.",
      },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  await connection();

  const admin = await getCurrentAdmin();

  if (!admin) {
    return Response.json({ success: false, message: "Sesi Admin tidak ditemukan." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const laporanId = searchParams.get("laporanId");

    if (!laporanId || !UUID_REGEX.test(laporanId)) {
      return Response.json({ success: false, message: "ID laporan tidak valid." }, { status: 400 });
    }

    const rows = await sql`
      SELECT
        id,
        nama_file,
        tipe_file,
        ukuran_file,
        created_at
      FROM bukti_dukung
      WHERE laporan_id = ${laporanId}
      ORDER BY created_at ASC, id ASC
    `;

    return Response.json({
      success: true,
      data: rows.map((row) => ({
        id: String(row.id),
        nama_file: String(row.nama_file),
        tipe_file: String(row.tipe_file),
        ukuran_file: Number(row.ukuran_file),
      })),
    });
  } catch (error) {
    console.error("Gagal mengambil daftar bukti dukung:", error);

    return Response.json({ success: false, message: "Gagal mengambil daftar bukti dukung." }, { status: 500 });
  }
}

import { connection } from "next/server";
import { get, del } from "@vercel/blob";
import { sql } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth/session";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteContext) {
  await connection();

  const admin = await getCurrentAdmin();

  if (!admin) {
    return Response.json({ success: false, message: "Sesi Admin tidak ditemukan." }, { status: 401 });
  }

  try {
    const { id } = await params;

    if (!UUID_REGEX.test(id)) {
      return Response.json({ success: false, message: "ID bukti dukung tidak valid." }, { status: 400 });
    }

    // Ambil metadata berdasarkan ID bukti dukung.
    const rows = await sql`
      SELECT
        id,
        nama_file,
        blob_url,
        tipe_file
      FROM bukti_dukung
      WHERE id = ${id}
      LIMIT 1
    `;

    if (rows.length === 0) {
      return Response.json({ success: false, message: "Bukti dukung tidak ditemukan." }, { status: 404 });
    }

    const bukti = rows[0];

    // Ambil file dari Private Blob.
    const result = await get(String(bukti.blob_url), {
      access: "private",
    });

    if (!result || result.statusCode !== 200) {
      return Response.json({ success: false, message: "File tidak ditemukan di penyimpanan." }, { status: 404 });
    }

    const namaFile = String(bukti.nama_file).replace(/[\r\n"]/g, "_");

    return new Response(result.stream, {
      headers: {
        "Content-Type": result.blob.contentType,
        "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(namaFile)}`,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("Gagal mengambil bukti dukung:", error);

    return Response.json(
      {
        success: false,
        message: "Terjadi kesalahan saat mengambil bukti dukung.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  await connection();

  const admin = await getCurrentAdmin();

  if (!admin) {
    return Response.json({ success: false, message: "Sesi Admin tidak ditemukan." }, { status: 401 });
  }

  try {
    const { id } = await params;

    if (!UUID_REGEX.test(id)) {
      return Response.json({ success: false, message: "ID bukti dukung tidak valid." }, { status: 400 });
    }

    const rows = await sql`
      SELECT id, blob_url
      FROM bukti_dukung
      WHERE id = ${id}
      LIMIT 1
    `;

    if (rows.length === 0) {
      return Response.json({ success: false, message: "Bukti dukung tidak ditemukan." }, { status: 404 });
    }

    const blobUrl = String(rows[0].blob_url);

    const deleted = await sql`
      DELETE FROM bukti_dukung
      WHERE id = ${id}
      RETURNING id
    `;

    if (deleted.length === 0) {
      return Response.json({ success: false, message: "Bukti dukung gagal dihapus." }, { status: 500 });
    }

    try {
      await del(blobUrl);
    } catch (blobError) {
      console.error("Gagal menghapus file dari Vercel Blob:", blobError);
    }

    return Response.json({
      success: true,
      message: "Bukti dukung berhasil dihapus.",
    });
  } catch (error) {
    console.error("Gagal menghapus bukti dukung:", error);

    return Response.json({ success: false, message: "Terjadi kesalahan saat menghapus bukti dukung." }, { status: 500 });
  }
}

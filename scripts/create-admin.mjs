import nextEnv from "@next/env";
import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd());

const databaseUrl = process.env.DATABASE_URL;
const nama = process.env.ADMIN_NAME;
const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;

async function createAdmin() {
  if (!databaseUrl || !nama || !email || !password) {
    throw new Error("DATABASE_URL, ADMIN_NAME, ADMIN_EMAIL, dan ADMIN_PASSWORD wajib diisi.");
  }

  if (password.length < 8) {
    throw new Error("Password minimal harus 8 karakter.");
  }

  const sql = neon(databaseUrl);

  const existingAdmin = await sql`
    SELECT id FROM admins WHERE email = ${email}
  `;

  if (existingAdmin.length > 0) {
    throw new Error("Email Admin tersebut sudah terdaftar.");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const result = await sql`
    INSERT INTO admins (nama, email, password_hash)
    VALUES (${nama}, ${email}, ${passwordHash})
    RETURNING id, nama, email, created_at
  `;

  console.log("Admin berhasil dibuat:");
  console.log(result[0]);
}

createAdmin().catch((error) => {
  console.error("Gagal membuat Admin:", error.message);
  process.exitCode = 1;
});

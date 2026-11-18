
"use server";

import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { getSession } from "@/lib/auth/session";

interface LoginState {
  error?: string;
}

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return {
      error: "Email dan password wajib diisi.",
    };
  }

  if (
    email.length > 150 ||
    password.length > 128 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    return {
      error: "Email atau password tidak valid.",
    };
  }

  try {
    const admins = await sql`
      SELECT
        id,
        nama,
        email,
        password_hash,
        is_active
      FROM admins
      WHERE email = ${email}
      LIMIT 1
    `;

    const admin = admins[0];

    if (!admin) {
      return {
        error: "Email atau password salah.",
      };
    }

    if (!admin.is_active) {
      return {
        error: "Akun Admin sedang dinonaktifkan.",
      };
    }

    const passwordValid = await verifyPassword(
      password,
      admin.password_hash
    );

    if (!passwordValid) {
      return {
        error: "Email atau password salah.",
      };
    }

    const session = await getSession();

    session.admin = {
      id: admin.id,
      nama: admin.nama,
      email: admin.email,
    };

    await session.save();
  } catch (error) {
    console.error("Login error:", error);

    return {
      error: "Terjadi kesalahan saat login. Silakan coba kembali.",
    };
  }

  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  const session = await getSession();

  session.destroy();

  redirect("/login");
}

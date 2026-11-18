
import "server-only";

import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";

export interface AdminSession {
  id: string;
  nama: string;
  email: string;
}

export interface SessionData {
  admin?: AdminSession;
}

const sessionPassword = process.env.SESSION_PASSWORD;

if (!sessionPassword || sessionPassword.length < 32) {
  throw new Error(
    "SESSION_PASSWORD wajib diisi dan minimal 32 karakter."
  );
}

export const sessionOptions: SessionOptions = {
  password: sessionPassword,
  cookieName: "monitoring-kinerja-session",
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  },
};

export async function getSession() {
  const cookieStore = await cookies();

  return getIronSession<SessionData>(
    cookieStore,
    sessionOptions
  );
}

export async function getCurrentAdmin() {
  const session = await getSession();

  return session.admin ?? null;
}

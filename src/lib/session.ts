import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function getSessionUser() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("rc_user_id")?.value;

  if (!userId) return null;

  // Hanya percaya rc_user_id yang di-set server. Tidak ada fallback role-based.
  const user = await prisma.user.findUnique({ where: { id: userId } });
  return user ?? null;
}

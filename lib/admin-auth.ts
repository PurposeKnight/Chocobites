import { supabase } from "@/lib/supabase-server";

export async function requireAdmin(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) throw new Error("Authentication required");
  const url = process.env.SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) throw new Error("Authentication is not configured");
  const result = await fetch(`${url}/auth/v1/user`, { headers: { apikey: anon, Authorization: `Bearer ${token}` }, cache: "no-store" });
  if (!result.ok) throw new Error("Invalid session");
  const user = await result.json() as { id: string };
  const rows = await supabase(`admin_users?user_id=eq.${encodeURIComponent(user.id)}&select=user_id&limit=1`) as unknown[];
  if (!rows.length) throw new Error("Admin access required");
  return user.id;
}

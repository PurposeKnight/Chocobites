import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { apiError } from "@/lib/http";
import { supabase } from "@/lib/supabase-server";
export async function GET(request:Request){try{await requireAdmin(request);const rows=await supabase("payments?select=id,amount_paise,status,upi_reference,submitted_at,orders!inner(order_number,customer_name,customer_email)&status=eq.pending_verification&order=submitted_at.asc");return NextResponse.json(rows,{headers:{"Cache-Control":"no-store"}})}catch(e){return apiError(e,"Unable to load payments.")}}

import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { apiError,requireSameOrigin } from "@/lib/http";
import { supabase } from "@/lib/supabase-server";
const schema=z.object({cod_enabled:z.boolean(),upi_enabled:z.boolean(),upi_id:z.string().trim().regex(/^[\w.\-]{2,}@[\w.\-]{2,}$/),upi_payee_name:z.string().trim().min(2).max(100),cod_shipping_paise:z.number().int().min(0).max(100000),upi_shipping_paise:z.number().int().min(0).max(100000),payment_instructions:z.string().trim().min(10).max(1000)});
export async function GET(request:Request){try{await requireAdmin(request);const rows=await supabase("payment_settings?singleton=eq.true&select=*");return NextResponse.json((rows as unknown[])[0])}catch(e){return apiError(e,"Unable to load settings.")}}
export async function PATCH(request:Request){try{requireSameOrigin(request);await requireAdmin(request);const value=schema.parse(await request.json());const rows=await supabase("payment_settings?singleton=eq.true",{method:"PATCH",body:{...value,updated_at:new Date().toISOString()}});return NextResponse.json((rows as unknown[])[0])}catch(e){return apiError(e,"Unable to save settings.")}}

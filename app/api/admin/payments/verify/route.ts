import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { verificationSchema } from "@/lib/payment-domain";
import { apiError, requireSameOrigin } from "@/lib/http";
import { rpc } from "@/lib/supabase-server";

export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const adminId = await requireAdmin(request);
    const input = verificationSchema.parse(await request.json());
    const result = await rpc("verify_upi_payment", { p_payment_id: input.paymentId, p_action: input.action, p_reason: input.reason ?? null, p_admin_id: adminId });
    return NextResponse.json(result);
  } catch (error) { return apiError(error, "The payment could not be updated."); }
}

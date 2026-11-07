import { NextResponse } from "next/server";
import { paymentSubmissionSchema } from "@/lib/payment-domain";
import { rpc } from "@/lib/supabase-server";
import { apiError, clientIp, requireSameOrigin } from "@/lib/http";

export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const input = paymentSubmissionSchema.parse(await request.json());
    const result = await rpc("submit_upi_payment", { p_order_number: input.orderNumber, p_access_token: input.accessToken, p_utr: input.utr, p_ip: clientIp(request) });
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return apiError(error, "We could not submit that payment reference."); }
}

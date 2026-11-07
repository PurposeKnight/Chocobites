import { NextResponse } from "next/server";
import { checkoutSchema, buildUpiUri } from "@/lib/payment-domain";
import { rpc } from "@/lib/supabase-server";
import { apiError, clientIp, requireSameOrigin } from "@/lib/http";

type OrderResult = { order_number: string; access_token: string; amount_paise: number; payment_method: "cod" | "upi"; upi_id?: string; payee_name?: string; instructions?: string };

export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const input = checkoutSchema.parse(await request.json());
    const order = await rpc<OrderResult>("create_checkout_order", { p_payload: input, p_ip: clientIp(request) });
    const upiUri = order.payment_method === "upi" && order.upi_id && order.payee_name
      ? buildUpiUri(order.upi_id, order.payee_name, order.amount_paise, order.order_number) : null;
    return NextResponse.json({ ...order, upi_uri: upiUri }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) { return apiError(error); }
}

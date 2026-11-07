import { z } from "zod";

export const checkoutSchema = z.object({
  idempotencyKey: z.string().uuid(),
  customer: z.object({
    name: z.string().trim().min(2).max(100),
    email: z.string().email().max(254),
    phone: z.string().regex(/^[6-9]\d{9}$/),
  }),
  address: z.object({
    line1: z.string().trim().min(5).max(160),
    line2: z.string().trim().max(160).optional().default(""),
    city: z.string().trim().min(2).max(80),
    state: z.string().trim().min(2).max(80),
    postalCode: z.string().regex(/^\d{6}$/),
  }),
  paymentMethod: z.enum(["cod", "upi"]),
  items: z.array(z.object({ productId: z.string().uuid(), quantity: z.number().int().min(1).max(20) })).min(1).max(25),
});

export const paymentSubmissionSchema = z.object({
  orderNumber: z.string().regex(/^CB-[A-Z0-9]{10,18}$/),
  accessToken: z.string().min(32).max(200),
  utr: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{8,35}$/),
});

export const verificationSchema = z.object({
  paymentId: z.string().uuid(),
  action: z.enum(["approve", "reject"]),
  independentlyVerified: z.literal(true),
  reason: z.string().trim().max(500).optional(),
}).superRefine((value, ctx) => {
  if (value.action === "reject" && (!value.reason || value.reason.length < 4)) {
    ctx.addIssue({ code: "custom", path: ["reason"], message: "A rejection reason is required." });
  }
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export function buildUpiUri(upiId: string, payeeName: string, amountPaise: number, reference: string) {
  const params = new URLSearchParams({
    pa: upiId,
    pn: payeeName,
    am: (amountPaise / 100).toFixed(2),
    cu: "INR",
    tr: reference,
    tn: `Chocobites order ${reference}`,
  });
  return `upi://pay?${params.toString()}`;
}

export const formatMoney = (paise: number) => new Intl.NumberFormat("en-IN", {
  style: "currency", currency: "INR", maximumFractionDigits: 2,
}).format(paise / 100);

import { createHmac, timingSafeEqual } from "node:crypto";

import { env } from "../config/env.js";

export type RazorpayOrder = { id: string; amount: number; currency: string };

export class PaymentUnavailableError extends Error {
  code = "PAYMENT_UNAVAILABLE" as const;
  constructor() { super("Payment service unavailable"); }
}

export function assertRazorpayConfigured() {
  if (env.RAZORPAY_KEY_ID === undefined || env.RAZORPAY_KEY_SECRET === undefined) {
    throw new PaymentUnavailableError();
  }
}

export async function createRazorpayOrder(amount: number, receipt: string): Promise<RazorpayOrder> {
  assertRazorpayConfigured();
  const credentials = Buffer.from(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`).toString("base64");
  const response = await fetch("https://api.razorpay.com/v1/orders", { method: "POST", headers: { Authorization: `Basic ${credentials}`, "Content-Type": "application/json" }, body: JSON.stringify({ amount, currency: "INR", receipt }) });
  if (!response.ok) throw new PaymentUnavailableError();
  return response.json() as Promise<RazorpayOrder>;
}

export function verifyRazorpaySignature(orderId: string, paymentId: string, signature: string, secret = env.RAZORPAY_KEY_SECRET): boolean {
  if (secret === undefined) return false;
  const expected = createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");
  const actual = Buffer.from(signature, "utf8"); const expectedBuffer = Buffer.from(expected, "utf8");
  return actual.length === expectedBuffer.length && timingSafeEqual(actual, expectedBuffer);
}

export function verifyRazorpayWebhookSignature(payload: Buffer, signature: string, secret = env.RAZORPAY_WEBHOOK_SECRET): boolean {
  if (secret === undefined) return false;
  const expected = createHmac("sha256", secret).update(payload).digest("hex"); const actual = Buffer.from(signature, "utf8"); const expectedBuffer = Buffer.from(expected, "utf8");
  return actual.length === expectedBuffer.length && timingSafeEqual(actual, expectedBuffer);
}

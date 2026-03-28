import crypto from "crypto";

export const verifyPayment = (
  orderId: string,
  paymentId: string,
  signature: string
): boolean => {
  const body = `${orderId}|${paymentId}`;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZOR_KEY as string)
    .update(body)
    .digest("hex");

  return expectedSignature === signature;
};